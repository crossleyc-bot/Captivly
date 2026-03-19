import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { stubTestEnv } from "@/__tests__/setup-env";
import { createHash } from "crypto";

stubTestEnv();

const mockFrom = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ then: vi.fn() }),
});

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

function makeDbChain(data: unknown) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data }),
      }),
    }),
    update: mockUpdate,
  };
}

describe("validateApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing Authorization header", async () => {
    const { validateApiKey } = await import("@/lib/api-key-auth");

    const request = new NextRequest("http://localhost/api/zapier/leads");
    const result = await validateApiKey(request);

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it("rejects non-Bearer auth scheme", async () => {
    const { validateApiKey } = await import("@/lib/api-key-auth");

    const request = new NextRequest("http://localhost/api/zapier/leads", {
      headers: { Authorization: "Basic abc123" },
    });
    const result = await validateApiKey(request);

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it("rejects invalid API key", async () => {
    const { validateApiKey } = await import("@/lib/api-key-auth");

    mockFrom.mockReturnValue(makeDbChain(null));

    const request = new NextRequest("http://localhost/api/zapier/leads", {
      headers: { Authorization: "Bearer captv_invalid_key" },
    });
    const result = await validateApiKey(request);

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it("returns userId for valid API key", async () => {
    const { validateApiKey } = await import("@/lib/api-key-auth");

    mockFrom.mockReturnValue(makeDbChain({ user_id: "user-123" }));

    const request = new NextRequest("http://localhost/api/zapier/leads", {
      headers: { Authorization: "Bearer captv_valid_key_here" },
    });
    const result = await validateApiKey(request);

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { userId: string }).userId).toBe("user-123");
  });

  it("looks up key by SHA-256 hash", async () => {
    const { validateApiKey } = await import("@/lib/api-key-auth");

    const chain = makeDbChain({ user_id: "user-123" });
    mockFrom.mockReturnValue(chain);

    const apiKey = "captv_test_key_12345";
    const expectedHash = createHash("sha256").update(apiKey).digest("hex");

    const request = new NextRequest("http://localhost/api/zapier/leads", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    await validateApiKey(request);

    // Verify the hash was used for lookup
    const eqFn = chain.select().eq;
    expect(eqFn).toHaveBeenCalledWith("key_hash", expectedHash);
  });
});

describe("generateApiKey", () => {
  it("generates key with captv_ prefix", async () => {
    const { generateApiKey } = await import("@/lib/api-key-auth");

    const { key, hash, prefix } = generateApiKey();

    expect(key).toMatch(/^captv_[a-f0-9]{64}$/);
    expect(prefix).toBe(key.slice(0, 14));
    expect(hash).toBe(createHash("sha256").update(key).digest("hex"));
  });

  it("generates unique keys each time", async () => {
    const { generateApiKey } = await import("@/lib/api-key-auth");

    const key1 = generateApiKey();
    const key2 = generateApiKey();

    expect(key1.key).not.toBe(key2.key);
    expect(key1.hash).not.toBe(key2.hash);
  });
});
