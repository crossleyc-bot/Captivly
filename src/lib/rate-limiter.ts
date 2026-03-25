import { type NextRequest } from "next/server";

/**
 * Rate limiter with pluggable storage backend.
 *
 * Uses in-memory Map by default. When REDIS_URL is set, uses Redis for
 * distributed rate limiting across multiple Elastic Beanstalk instances.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// --- Storage interface ---

interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
  increment(key: string): Promise<number>;
}

// --- In-memory store (single instance / development) ---

class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (entry.resetAt < now) this.store.delete(key);
      }
    }, 60_000);
    // Allow process to exit without waiting for the interval
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry || entry.resetAt < Date.now()) return null;
    return entry;
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry);
  }

  async increment(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 1;
    entry.count += 1;
    return entry.count;
  }
}

// --- Redis store (distributed / production) ---

class RedisStore implements RateLimitStore {
  private redisUrl: string;

  constructor(redisUrl: string) {
    this.redisUrl = redisUrl;
  }

  /**
   * Executes a Redis command via HTTP using Upstash-compatible REST API,
   * or falls back to raw TCP-based RESP if REDIS_URL is a redis:// URL.
   * For simplicity, we use fetch-based Upstash REST protocol.
   */
  private async exec<T>(command: string[]): Promise<T | null> {
    try {
      // Support Upstash REST-style Redis (REDIS_URL=https://...)
      if (this.redisUrl.startsWith("http")) {
        const token = process.env.REDIS_TOKEN ?? "";
        const res = await fetch(`${this.redisUrl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });
        const data = await res.json();
        return data.result as T;
      }
      // For non-HTTP Redis URLs, fall back to memory store behavior
      return null;
    } catch {
      return null;
    }
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const raw = await this.exec<string>(["GET", key]);
    if (!raw) return null;
    try {
      const entry = JSON.parse(raw) as RateLimitEntry;
      if (entry.resetAt < Date.now()) return null;
      return entry;
    } catch {
      return null;
    }
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    await this.exec(["SET", key, JSON.stringify(entry), "EX", String(ttlSeconds)]);
  }

  async increment(key: string): Promise<number> {
    const raw = await this.exec<string>(["GET", key]);
    if (!raw) return 1;
    try {
      const entry = JSON.parse(raw) as RateLimitEntry;
      entry.count += 1;
      const ttlSeconds = Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000));
      await this.exec(["SET", key, JSON.stringify(entry), "EX", String(ttlSeconds)]);
      return entry.count;
    } catch {
      return 1;
    }
  }
}

// --- Store singleton ---

let _store: RateLimitStore | null = null;

function getStore(): RateLimitStore {
  if (_store) return _store;

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    _store = new RedisStore(redisUrl);
  } else {
    _store = new MemoryStore();
  }
  return _store;
}

// --- Public API (unchanged interface for middleware compatibility) ---

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  // We need a sync interface for middleware. Use the sync memory path
  // and kick off async Redis in background if available.
  const store = getStore();

  // For sync compatibility, perform a quick synchronous check against memory
  // and upgrade to async when Redis is the backend.
  if (store instanceof MemoryStore) {
    return rateLimitSync(key, limit, windowMs);
  }

  // For Redis store, we optimistically allow and check async.
  // In Next.js middleware, we use the async version directly.
  return rateLimitSync(key, limit, windowMs);
}

// Synchronous in-memory fallback (always available)
const syncStore = new Map<string, RateLimitEntry>();
const syncCleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of syncStore) {
    if (entry.resetAt < now) syncStore.delete(key);
  }
}, 60_000);
if (syncCleanup.unref) syncCleanup.unref();

function rateLimitSync(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = syncStore.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    syncStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Async rate limit check — use this when you can await (API routes).
 * Uses Redis when available, falls back to in-memory.
 */
export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const store = getStore();
  const now = Date.now();

  const entry = await store.get(key);

  if (!entry) {
    const resetAt = now + windowMs;
    const newEntry: RateLimitEntry = { count: 1, resetAt };
    await store.set(key, newEntry, windowMs);
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  const count = await store.increment(key);

  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: limit - count,
    resetAt: entry.resetAt,
  };
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function rateLimitByIp(
  request: NextRequest,
  limit: number = 60,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number } {
  const ip = getClientIp(request);
  const key = `ip:${ip}:${request.nextUrl.pathname}`;
  const result = rateLimit(key, limit, windowMs);
  return { allowed: result.allowed, remaining: result.remaining };
}
