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
// GET /api/agency/members
// ---------------------------------------------------------------------------
describe("GET /api/agency/members", () => {
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

  it("returns members for agency owner", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    const members = [
      { id: "m1", user_id: "user-1", role: "owner", user: { email: "owner@example.com", full_name: "Owner" } },
      { id: "m2", user_id: "user-2", role: "member", user: { email: "member@example.com", full_name: "Member" } },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // agencies: owner lookup
        return chainSelect({ id: "agency-1" });
      }
      // agency_members: list
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: members }),
          }),
        }),
      };
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.members).toHaveLength(2);
  });

  it("returns members for non-owner member via membership fallback", async () => {
    mockUser({ id: "user-2", email: "member@example.com" });

    const members = [
      { id: "m1", user_id: "user-1", role: "owner", user: { email: "owner@example.com", full_name: "Owner" } },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // agencies: not owner
        return chainSelect(null);
      }
      if (callCount === 2) {
        // agency_members: membership lookup
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { agency_id: "agency-1" } }),
            }),
          }),
        };
      }
      // agency_members: list
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: members }),
          }),
        }),
      };
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.members).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/agency/members
// ---------------------------------------------------------------------------
describe("POST /api/agency/members", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockUser(null);

    const req = new NextRequest("http://localhost/api/agency/members", {
      method: "POST",
      body: JSON.stringify({ email: "new@example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 404 when user has no agency", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockFrom.mockImplementation(() => chainSelect(null));

    const req = new NextRequest("http://localhost/api/agency/members", {
      method: "POST",
      body: JSON.stringify({ email: "new@example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("returns 400 when email is empty", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockFrom.mockReturnValue(chainSelect({ id: "agency-1" }));

    const req = new NextRequest("http://localhost/api/agency/members", {
      method: "POST",
      body: JSON.stringify({ email: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when target user doesn't exist", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainSelect({ id: "agency-1" });
      }
      // users lookup: not found
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    const req = new NextRequest("http://localhost/api/agency/members", {
      method: "POST",
      body: JSON.stringify({ email: "nonexistent@example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("sign up");
  });

  it("returns 409 when user is already a member", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainSelect({ id: "agency-1" });
      }
      if (callCount === 2) {
        // users: found target user
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "user-2" } }),
            }),
          }),
        };
      }
      // agency_members insert: duplicate
      return {
        insert: vi.fn().mockResolvedValue({
          error: { code: "23505", message: "duplicate key" },
        }),
      };
    });

    const req = new NextRequest("http://localhost/api/agency/members", {
      method: "POST",
      body: JSON.stringify({ email: "existing@example.com" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already a member");
  });

  it("adds member with correct role", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainSelect({ id: "agency-1" });
      }
      if (callCount === 2) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "user-2" } }),
            }),
          }),
        };
      }
      return { insert: mockInsert };
    });

    const req = new NextRequest("http://localhost/api/agency/members", {
      method: "POST",
      body: JSON.stringify({ email: "new@example.com", role: "admin" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.added).toBe(true);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ role: "admin" })
    );
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/agency/members
// ---------------------------------------------------------------------------
describe("DELETE /api/agency/members", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockUser(null);

    const req = new NextRequest("http://localhost/api/agency/members", {
      method: "DELETE",
      body: JSON.stringify({ member_id: "m1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when trying to remove the owner", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // agencies: owner
        return chainSelect({ id: "agency-1" });
      }
      // agency_members: member lookup returns owner
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { user_id: "user-1", role: "owner" },
              }),
            }),
          }),
        }),
      };
    });

    const req = new NextRequest("http://localhost/api/agency/members", {
      method: "DELETE",
      body: JSON.stringify({ member_id: "m1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("owner");
  });

  it("returns 403 when admin tries to remove another admin", async () => {
    mockUser({ id: "user-admin", email: "admin@example.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // agencies: not owner
        return chainSelect(null);
      }
      if (callCount === 2) {
        // agency_members: caller is admin
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { agency_id: "agency-1", role: "admin" },
                }),
              }),
            }),
          }),
        };
      }
      // agency_members: target member is also admin
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { user_id: "user-other-admin", role: "admin" },
              }),
            }),
          }),
        }),
      };
    });

    const req = new NextRequest("http://localhost/api/agency/members", {
      method: "DELETE",
      body: JSON.stringify({ member_id: "m2" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Admins cannot remove other admins");
  });

  it("removes a regular member successfully", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // agencies: owner
        return chainSelect({ id: "agency-1" });
      }
      if (callCount === 2) {
        // agency_members: member lookup
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { user_id: "user-2", role: "member" },
                }),
              }),
            }),
          }),
        };
      }
      // agency_members: delete
      return { delete: mockDelete };
    });

    const req = new NextRequest("http://localhost/api/agency/members", {
      method: "DELETE",
      body: JSON.stringify({ member_id: "m2" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.removed).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });
});
