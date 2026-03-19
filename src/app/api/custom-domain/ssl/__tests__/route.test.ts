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
// POST /api/custom-domain/ssl
// ---------------------------------------------------------------------------
describe("POST /api/custom-domain/ssl", () => {
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
  });

  it("returns 400 when domain not verified", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainSelect({ plan_tier: "pro" });
      if (callCount === 2) return chainSelect({ id: "biz-1" });
      return chainSelect({
        id: "dom-1",
        domain: "app.test.com",
        verified: false,
        ssl_provisioned: false,
      });
    });

    const res = await POST();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("verified");
  });

  it("returns already_provisioned when SSL already set up", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainSelect({ plan_tier: "pro" });
      if (callCount === 2) return chainSelect({ id: "biz-1" });
      return chainSelect({
        id: "dom-1",
        domain: "app.test.com",
        verified: true,
        ssl_provisioned: true,
      });
    });

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ssl_provisioned).toBe(true);
    expect(body.already_provisioned).toBe(true);
  });

  it("provisions SSL for verified domain", async () => {
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
          domain: "app.test.com",
          verified: true,
          ssl_provisioned: false,
        });
      }
      return { update: mockUpdate };
    });

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ssl_provisioned).toBe(true);
  });
});
