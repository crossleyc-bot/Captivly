/**
 * Simple in-memory TTL cache for server-side data.
 *
 * Used to avoid redundant database queries for data that changes infrequently
 * (plan tiers, business config, etc.). Each Next.js server process maintains
 * its own cache; this is intentional for simplicity.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Get a cached value, or compute and cache it if missing/expired.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  compute: () => Promise<T>
): Promise<T> {
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value;
  }

  const value = await compute();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

/**
 * Invalidate a specific cache key.
 */
export function invalidateCache(key: string): void {
  store.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix.
 */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

// Convenience TTL constants
export const CACHE_TTL = {
  SHORT: 30 * 1000,       // 30 seconds — usage counts, lead counts
  MEDIUM: 5 * 60 * 1000,  // 5 minutes — plan tier, business config
  LONG: 30 * 60 * 1000,   // 30 minutes — static-ish data
} as const;
