import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockAuthGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/feature-gate", () => ({
  checkUsageLimit: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { POST } from "../route";
import { NextRequest } from "next/server";
import { checkUsageLimit } from "@/lib/feature-gate";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/meta/create-campaign", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/meta/create-campaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const businessData = {
      id: "biz-1",
      meta_ad_account_id: "act_123",
      meta_page_id: "page_456",
      meta_access_token: "token_abc",
      name: "Test Gym",
      type: "gym",
      primary_offer: "Free trial",
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { plan_tier: "growth" },
              }),
            }),
          }),
        };
      }
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: businessData,
              }),
            }),
          }),
        };
      }
      if (table === "campaigns") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ count: 0 }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "camp-new", name: "My Campaign" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    vi.mocked(checkUsageLimit).mockResolvedValue({
      allowed: true,
      current: 10,
      limit: 500,
    });

    // Mock Meta API responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/campaigns")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "meta-camp-1" }),
        });
      }
      if (url.includes("/adsets")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "meta-adset-1" }),
        });
      }
      if (url.includes("/leadgen_forms")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "meta-form-1" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest({ name: "Test", daily_budget_cents: 500 }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when no business found", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { plan_tier: "growth" } }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    const res = await POST(makeRequest({ name: "Test", daily_budget_cents: 500 }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when Meta is not connected", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { plan_tier: "growth" } }),
            }),
          }),
        };
      }
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "biz-1", meta_ad_account_id: null, meta_access_token: null },
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    const res = await POST(makeRequest({ name: "Test", daily_budget_cents: 500 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Meta ad account not connected");
  });

  it("returns 403 when campaign limit reached", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { plan_tier: "starter" } }),
            }),
          }),
        };
      }
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "biz-1",
                  meta_ad_account_id: "act_123",
                  meta_access_token: "token",
                },
              }),
            }),
          }),
        };
      }
      if (table === "campaigns") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ count: 1 }), // at limit for starter
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    const res = await POST(makeRequest({ name: "Test", daily_budget_cents: 500 }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Campaign limit reached");
  });

  it("returns 400 for missing campaign name", async () => {
    const res = await POST(makeRequest({ name: "", daily_budget_cents: 500 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid daily budget", async () => {
    const res = await POST(makeRequest({ name: "Test Campaign", daily_budget_cents: 50 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Daily budget");
  });

  it("returns 400 for invalid target_url", async () => {
    const res = await POST(
      makeRequest({
        name: "Test Campaign",
        daily_budget_cents: 500,
        target_url: "not-a-url",
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("target_url");
  });

  it("creates campaign via Meta API and saves to database", async () => {
    const res = await POST(
      makeRequest({ name: "My Campaign", daily_budget_cents: 1000 })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.campaign).toBeDefined();

    // Verify Meta API calls
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/campaigns"),
      expect.objectContaining({ method: "POST" })
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/adsets"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns 502 when Meta campaign creation fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: "Meta error" } }),
    });

    const res = await POST(
      makeRequest({ name: "My Campaign", daily_budget_cents: 1000 })
    );
    expect(res.status).toBe(502);
  });
});
