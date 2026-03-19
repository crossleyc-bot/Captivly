import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/feature-gate", () => ({
  requirePlan: vi.fn(),
}));

const mockResolve = vi.fn();
vi.mock("dns/promises", () => ({
  resolve: (...args: unknown[]) => mockResolve(...args),
}));

import { POST } from "../route";
import { requirePlan } from "@/lib/feature-gate";

const mockRequirePlan = vi.mocked(requirePlan);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mockUser(user: { id: string; email: string } | null) {
  mockGetUser.mockResolvedValue({ data: { user } });
}

function chainSelect(data: unknown) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data }),
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// POST /api/custom-domain/verify
// ---------------------------------------------------------------------------
describe("POST /api/custom-domain/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePlan.mockReturnValue(true);
  });

  it("returns 401 when not authenticated", async () => {
    mockUser(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("returns 403 when not on Pro plan", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(false);

    mockFrom.mockReturnValue(chainSelect({ plan_tier: "starter" }));

    const res = await POST();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Pro plan");
  });

  it("returns 404 when no business found", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainSelect({ plan_tier: "pro" });
      return chainSelect(null);
    });

    const res = await POST();
    expect(res.status).toBe(404);
  });

  it("returns 404 when no domain configured", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainSelect({ plan_tier: "pro" });
      if (callCount === 2) return chainSelect({ id: "biz-1" });
      return chainSelect(null);
    });

    const res = await POST();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("No domain configured");
  });

  it("returns already_verified when domain is already verified", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainSelect({ plan_tier: "pro" });
      if (callCount === 2) return chainSelect({ id: "biz-1" });
      return chainSelect({
        id: "dom-1",
        domain: "app.test.com",
        verification_token: "captivly-verify-abc",
        verified: true,
      });
    });

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(true);
    expect(body.already_verified).toBe(true);
  });

  it("returns verified: false when TXT record not found", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainSelect({ plan_tier: "pro" });
      if (callCount === 2) return chainSelect({ id: "biz-1" });
      return chainSelect({
        id: "dom-1",
        domain: "app.test.com",
        verification_token: "captivly-verify-abc",
        verified: false,
      });
    });

    mockResolve.mockResolvedValue([["some-other-record"]]);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(false);
    expect(body.message).toContain("TXT record not found");
  });

  it("verifies domain when TXT record matches", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainSelect({ plan_tier: "pro" });
      if (callCount === 2) return chainSelect({ id: "biz-1" });
      if (callCount === 3) {
        return chainSelect({
          id: "dom-1",
          business_id: "biz-1",
          domain: "app.test.com",
          verification_token: "captivly-verify-abc",
          verified: false,
        });
      }
      // Updates for custom_domains and white_label_config
      return { update: mockUpdate };
    });

    mockResolve.mockResolvedValue([["captivly-verify-abc"]]);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(true);
  });

  it("handles DNS resolution failure", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainSelect({ plan_tier: "pro" });
      if (callCount === 2) return chainSelect({ id: "biz-1" });
      return chainSelect({
        id: "dom-1",
        domain: "app.test.com",
        verification_token: "captivly-verify-abc",
        verified: false,
      });
    });

    mockResolve.mockRejectedValue(new Error("ENOTFOUND"));

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(false);
    expect(body.message).toContain("Could not resolve DNS");
  });
});
