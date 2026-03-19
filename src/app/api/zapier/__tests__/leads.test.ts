import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockFrom = vi.fn();

vi.mock("@/lib/api-key-auth", () => ({
  validateApiKey: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { GET } from "../leads/route";
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-key-auth";

const mockValidateApiKey = vi.mocked(validateApiKey);

describe("GET /api/zapier/leads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no Authorization header", async () => {
    mockValidateApiKey.mockResolvedValue(
      NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      )
    );

    const req = new NextRequest("http://localhost/api/zapier/leads");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns 404 when no business found for user", async () => {
    mockValidateApiKey.mockResolvedValue({ userId: "user-1" });

    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new NextRequest("http://localhost/api/zapier/leads");
    const res = await GET(req);

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("No business found");
  });

  it("returns leads for authenticated user's business", async () => {
    mockValidateApiKey.mockResolvedValue({ userId: "user-1" });

    const mockLeads = [
      { id: "lead-1", first_name: "John", email: "john@example.com", status: "new" },
      { id: "lead-2", first_name: "Jane", email: "jane@example.com", status: "converted" },
    ];

    const limitFn = vi.fn().mockResolvedValue({ data: mockLeads, error: null });
    const orderFn = vi.fn().mockReturnValue({ limit: limitFn });
    const eqLeadsFn = vi.fn().mockReturnValue({ order: orderFn });
    const selectLeadsFn = vi.fn().mockReturnValue({ eq: eqLeadsFn });

    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "biz-1" } }),
            }),
          }),
        };
      }
      if (table === "leads") {
        return { select: selectLeadsFn };
      }
      return {};
    });

    const req = new NextRequest("http://localhost/api/zapier/leads");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockLeads);
  });

  it("filters by status query param", async () => {
    mockValidateApiKey.mockResolvedValue({ userId: "user-1" });

    const statusEqFn = vi.fn().mockResolvedValue({ data: [], error: null });
    const chainEnd = Object.assign(Promise.resolve({ data: [], error: null }), { eq: statusEqFn });
    const limitFn = vi.fn().mockReturnValue(chainEnd);
    const orderFn = vi.fn().mockReturnValue({ limit: limitFn });
    const eqLeadsFn = vi.fn().mockReturnValue({ order: orderFn });
    const selectLeadsFn = vi.fn().mockReturnValue({ eq: eqLeadsFn });

    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "biz-1" } }),
            }),
          }),
        };
      }
      if (table === "leads") {
        return { select: selectLeadsFn };
      }
      return {};
    });

    const req = new NextRequest("http://localhost/api/zapier/leads?status=new");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(statusEqFn).toHaveBeenCalledWith("status", "new");
  });

  it("filters by since query param", async () => {
    mockValidateApiKey.mockResolvedValue({ userId: "user-1" });

    const gtFn = vi.fn().mockResolvedValue({ data: [], error: null });
    const chainEnd = Object.assign(Promise.resolve({ data: [], error: null }), { gt: gtFn });
    const limitFn = vi.fn().mockReturnValue(chainEnd);
    const orderFn = vi.fn().mockReturnValue({ limit: limitFn });
    const eqLeadsFn = vi.fn().mockReturnValue({ order: orderFn });
    const selectLeadsFn = vi.fn().mockReturnValue({ eq: eqLeadsFn });

    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "biz-1" } }),
            }),
          }),
        };
      }
      if (table === "leads") {
        return { select: selectLeadsFn };
      }
      return {};
    });

    const sinceDate = "2026-03-01T00:00:00Z";
    const req = new NextRequest(`http://localhost/api/zapier/leads?since=${sinceDate}`);
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(gtFn).toHaveBeenCalledWith("created_at", sinceDate);
  });

  it("respects limit param (capped at 100)", async () => {
    mockValidateApiKey.mockResolvedValue({ userId: "user-1" });

    const limitFn = vi.fn().mockResolvedValue({ data: [], error: null });
    const orderFn = vi.fn().mockReturnValue({ limit: limitFn });
    const eqLeadsFn = vi.fn().mockReturnValue({ order: orderFn });
    const selectLeadsFn = vi.fn().mockReturnValue({ eq: eqLeadsFn });

    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "biz-1" } }),
            }),
          }),
        };
      }
      if (table === "leads") {
        return { select: selectLeadsFn };
      }
      return {};
    });

    const req = new NextRequest("http://localhost/api/zapier/leads?limit=500");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(limitFn).toHaveBeenCalledWith(100);
  });
});
