import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockFrom = vi.fn();
const mockAuthGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  })),
}));

// Mock crypto.randomBytes to produce a deterministic code
vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return {
    ...actual,
    randomBytes: vi.fn(() => Buffer.from("abcdef123456")),
  };
});

import { GET, POST } from "../route";
import { NextRequest } from "next/server";

describe("GET /api/referrals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns 404 when no business found", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

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

    const res = await GET();

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("No business found");
  });

  it("returns referral links for business", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const mockLinks = [
      { id: "ref-1", code: "abc123", business_id: "biz-1", referrer_name: "John" },
    ];

    const orderFn = vi.fn().mockResolvedValue({ data: mockLinks });
    const eqLinksFn = vi.fn().mockReturnValue({ order: orderFn });
    const selectLinksFn = vi.fn().mockReturnValue({ eq: eqLinksFn });

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
      if (table === "referral_links") {
        return { select: selectLinksFn };
      }
      return {};
    });

    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.links).toEqual(mockLinks);
  });
});

describe("POST /api/referrals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest("http://localhost/api/referrals", {
      method: "POST",
      body: JSON.stringify({ referrer_name: "John" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("creates a referral link with generated code", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const createdLink = {
      id: "ref-new",
      business_id: "biz-1",
      code: "YWJjZGVmMTIzNDU2",
      referrer_name: "Jane",
      referrer_email: "jane@example.com",
      lead_id: null,
    };

    const singleFn = vi.fn().mockResolvedValue({ data: createdLink, error: null });
    const selectInsertFn = vi.fn().mockReturnValue({ single: singleFn });
    const insertFn = vi.fn().mockReturnValue({ select: selectInsertFn });

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
      if (table === "referral_links") {
        return { insert: insertFn };
      }
      return {};
    });

    const req = new NextRequest("http://localhost/api/referrals", {
      method: "POST",
      body: JSON.stringify({
        referrer_name: "Jane",
        referrer_email: "jane@example.com",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.link).toEqual(createdLink);
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: "biz-1",
        referrer_name: "Jane",
        referrer_email: "jane@example.com",
        code: expect.any(String),
      })
    );
  });
});
