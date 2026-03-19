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

import { GET, PUT } from "../route";
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
// GET /api/white-label
// ---------------------------------------------------------------------------
describe("GET /api/white-label", () => {
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

  it("returns 403 when user is not on pro plan", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(false);

    // users table: starter plan
    mockFrom.mockReturnValue(chainSelect({ plan_tier: "starter" }));

    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Pro plan");
  });

  it("returns config for pro user", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(true);

    const config = {
      id: "wl-1",
      business_id: "biz-1",
      app_name: "My App",
      primary_color: "#000000",
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
      // white_label_config table
      return chainSelect(config);
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.config).toEqual(config);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/white-label
// ---------------------------------------------------------------------------
describe("PUT /api/white-label", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockUser(null);

    const req = new NextRequest("http://localhost/api/white-label", {
      method: "PUT",
      body: JSON.stringify({ app_name: "Custom" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when not pro", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(false);

    mockFrom.mockReturnValue(chainSelect({ plan_tier: "growth" }));

    const req = new NextRequest("http://localhost/api/white-label", {
      method: "PUT",
      body: JSON.stringify({ app_name: "Custom" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PUT(req);
    expect(res.status).toBe(403);
  });

  it("upserts config with provided values", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(true);

    const upsertedConfig = {
      id: "wl-1",
      business_id: "biz-1",
      app_name: "My Custom App",
      primary_color: "#ff0000",
      accent_color: "#3b82f6",
    };

    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: upsertedConfig, error: null }),
      }),
    });

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
        // white_label_config: fetch existing config
        return chainSelect(null);
      }
      // white_label_config upsert
      return { upsert: mockUpsert };
    });

    const req = new NextRequest("http://localhost/api/white-label", {
      method: "PUT",
      body: JSON.stringify({
        app_name: "My Custom App",
        primary_color: "#ff0000",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.config).toEqual(upsertedConfig);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: "biz-1",
        app_name: "My Custom App",
        primary_color: "#ff0000",
      }),
      { onConflict: "business_id" }
    );
  });
});
