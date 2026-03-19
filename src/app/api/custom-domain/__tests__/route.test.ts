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

import { GET, POST, DELETE } from "../route";
import { NextRequest } from "next/server";
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
// GET /api/custom-domain
// ---------------------------------------------------------------------------
describe("GET /api/custom-domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockUser(null);

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns domain config", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    const domainConfig = {
      id: "dom-1",
      business_id: "biz-1",
      domain: "app.mybusiness.com",
      verified: true,
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // businesses table
        return chainSelect({ id: "biz-1" });
      }
      // custom_domains table
      return chainSelect(domainConfig);
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domain).toEqual(domainConfig);
  });
});

// ---------------------------------------------------------------------------
// POST /api/custom-domain
// ---------------------------------------------------------------------------
describe("POST /api/custom-domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockUser(null);

    const req = new NextRequest("http://localhost/api/custom-domain", {
      method: "POST",
      body: JSON.stringify({ domain: "app.example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when not pro", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(false);

    mockFrom.mockReturnValue(chainSelect({ plan_tier: "starter" }));

    const req = new NextRequest("http://localhost/api/custom-domain", {
      method: "POST",
      body: JSON.stringify({ domain: "app.example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Pro plan");
  });

  it("returns 400 for invalid domain format", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(true);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // users table: pro plan
        return chainSelect({ plan_tier: "pro" });
      }
      // businesses table
      return chainSelect({ id: "biz-1" });
    });

    const req = new NextRequest("http://localhost/api/custom-domain", {
      method: "POST",
      body: JSON.stringify({ domain: "not a valid domain!!" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid domain");
  });

  it("registers domain with verification token", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(true);

    const createdDomain = {
      id: "dom-1",
      business_id: "biz-1",
      domain: "app.mybusiness.com",
      verification_token: "captivly-verify-abc123",
      verified: false,
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // users table: pro plan
        return chainSelect({ plan_tier: "pro" });
      }
      if (callCount === 2) {
        // businesses table
        return chainSelect({ id: "biz-1" });
      }
      if (callCount === 3) {
        // custom_domains: no existing domain
        return chainSelect(null);
      }
      // custom_domains insert
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: createdDomain, error: null }),
          }),
        }),
      };
    });

    const req = new NextRequest("http://localhost/api/custom-domain", {
      method: "POST",
      body: JSON.stringify({ domain: "app.mybusiness.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domain).toEqual(createdDomain);
    expect(body.domain.verification_token).toContain("captivly-verify");
  });

  it("returns 409 when domain already taken (unique constraint error code 23505)", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(true);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // users table: pro plan
        return chainSelect({ plan_tier: "pro" });
      }
      if (callCount === 2) {
        // businesses table
        return chainSelect({ id: "biz-1" });
      }
      if (callCount === 3) {
        // custom_domains: no existing domain for this business
        return chainSelect(null);
      }
      // custom_domains insert: unique constraint violation
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: "23505", message: "duplicate key value violates unique constraint" },
            }),
          }),
        }),
      };
    });

    const req = new NextRequest("http://localhost/api/custom-domain", {
      method: "POST",
      body: JSON.stringify({ domain: "taken.example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already registered");
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/custom-domain
// ---------------------------------------------------------------------------
describe("DELETE /api/custom-domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes domain and clears white_label_config", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      callCount++;
      if (table === "businesses") {
        return chainSelect({ id: "biz-1" });
      }
      if (table === "custom_domains") {
        return { delete: mockDelete };
      }
      if (table === "white_label_config") {
        return { update: mockUpdate };
      }
      return chainSelect(null);
    });

    const res = await DELETE();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.removed).toBe(true);

    // Verify custom_domains delete was called
    expect(mockDelete).toHaveBeenCalled();

    // Verify white_label_config was updated to clear domain
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        custom_domain: null,
        custom_domain_verified: false,
      })
    );
  });
});
