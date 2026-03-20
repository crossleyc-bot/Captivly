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

import { GET, POST, DELETE } from "../route";
import { NextRequest } from "next/server";

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
// GET /api/agency/clients
// ---------------------------------------------------------------------------
describe("GET /api/agency/clients", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockUser(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when user has no agency", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockFrom.mockImplementation(() => chainSelect(null));
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns clients for agency owner", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    const clients = [
      { id: "biz-1", name: "Gym A", type: "gym", location_city: "NYC", location_state: "NY", created_at: "2026-01-01" },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // agencies: owner lookup
        return chainSelect({ id: "agency-1" });
      }
      // businesses: client list
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: clients }),
          }),
        }),
      };
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clients).toHaveLength(1);
    expect(body.clients[0].name).toBe("Gym A");
  });
});

// ---------------------------------------------------------------------------
// POST /api/agency/clients
// ---------------------------------------------------------------------------
describe("POST /api/agency/clients", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockUser(null);

    const req = new NextRequest("http://localhost/api/agency/clients", {
      method: "POST",
      body: JSON.stringify({ business_id: "biz-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not owner or admin", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // agencies: not owner
        return chainSelect(null);
      }
      // agency_members: not admin/owner
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      };
    });

    const req = new NextRequest("http://localhost/api/agency/clients", {
      method: "POST",
      body: JSON.stringify({ business_id: "biz-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 when business_id is missing", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockFrom.mockReturnValue(chainSelect({ id: "agency-1" }));

    const req = new NextRequest("http://localhost/api/agency/clients", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when business not found", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // agencies: owner
        return chainSelect({ id: "agency-1" });
      }
      // businesses: not found
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    const req = new NextRequest("http://localhost/api/agency/clients", {
      method: "POST",
      body: JSON.stringify({ business_id: "nonexistent" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 403 when business owner is not an agency member", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // agencies: owner
        return chainSelect({ id: "agency-1" });
      }
      if (callCount === 2) {
        // businesses: found, owned by someone else
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "biz-1", user_id: "user-other" },
              }),
            }),
          }),
        };
      }
      // agency_members: owner not a member
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      };
    });

    const req = new NextRequest("http://localhost/api/agency/clients", {
      method: "POST",
      body: JSON.stringify({ business_id: "biz-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("member of the agency");
  });

  it("adds business when owner is the requesting user", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // agencies: owner
        return chainSelect({ id: "agency-1" });
      }
      if (callCount === 2) {
        // businesses: found, owned by requesting user
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "biz-1", user_id: "user-1" },
              }),
            }),
          }),
        };
      }
      // The ownership check passes (user_id === user.id), so no member check needed
      // Next call is businesses update
      return { update: mockUpdate };
    });

    const req = new NextRequest("http://localhost/api/agency/clients", {
      method: "POST",
      body: JSON.stringify({ business_id: "biz-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.added).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/agency/clients
// ---------------------------------------------------------------------------
describe("DELETE /api/agency/clients", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockUser(null);

    const req = new NextRequest("http://localhost/api/agency/clients", {
      method: "DELETE",
      body: JSON.stringify({ business_id: "biz-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not owner or admin", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainSelect(null);
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      };
    });

    const req = new NextRequest("http://localhost/api/agency/clients", {
      method: "DELETE",
      body: JSON.stringify({ business_id: "biz-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });

  it("removes business from agency", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainSelect({ id: "agency-1" });
      }
      return { update: mockUpdate };
    });

    const req = new NextRequest("http://localhost/api/agency/clients", {
      method: "DELETE",
      body: JSON.stringify({ business_id: "biz-1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.removed).toBe(true);
  });
});
