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

import { GET, POST } from "../route";
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
// Tests
// ---------------------------------------------------------------------------
describe("GET /api/agency", () => {
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

  it("returns null agency when user has no agency", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    // First call: agencies query returns null
    // Second call: agency_members query returns null
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return chainSelect(null);
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agency).toBeNull();
  });

  it('returns agency with role "owner" when user owns one', async () => {
    mockUser({ id: "user-1", email: "test@example.com" });

    const agency = { id: "agency-1", owner_user_id: "user-1", name: "My Agency" };
    mockFrom.mockReturnValue(chainSelect(agency));

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agency).toEqual(agency);
    expect(body.role).toBe("owner");
  });
});

describe("POST /api/agency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockUser(null);

    const req = new NextRequest("http://localhost/api/agency", {
      method: "POST",
      body: JSON.stringify({ name: "Test Agency" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user plan is not pro", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(false);

    // users table returns starter plan
    mockFrom.mockReturnValue(chainSelect({ plan_tier: "starter" }));

    const req = new NextRequest("http://localhost/api/agency", {
      method: "POST",
      body: JSON.stringify({ name: "Test Agency" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Pro plan");
  });

  it("returns 409 when user already has an agency", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(true);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // users table: pro plan
        return chainSelect({ plan_tier: "pro" });
      }
      // agencies table: existing agency
      return chainSelect({ id: "agency-existing" });
    });

    const req = new NextRequest("http://localhost/api/agency", {
      method: "POST",
      body: JSON.stringify({ name: "Test Agency" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already have an agency");
  });

  it("creates agency and adds owner as member", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(true);

    const createdAgency = { id: "agency-new", owner_user_id: "user-1", name: "New Agency" };
    const mockInsert = vi.fn();

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // users table: pro plan
        return chainSelect({ plan_tier: "pro" });
      }
      if (callCount === 2) {
        // agencies table: no existing agency
        return chainSelect(null);
      }
      if (callCount === 3) {
        // agencies insert
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: createdAgency, error: null }),
            }),
          }),
        };
      }
      // agency_members insert
      return {
        insert: mockInsert.mockResolvedValue({ error: null }),
      };
    });

    const req = new NextRequest("http://localhost/api/agency", {
      method: "POST",
      body: JSON.stringify({ name: "New Agency" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agency).toEqual(createdAgency);

    // Verify agency_members insert was called with owner role
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agency_id: "agency-new",
        user_id: "user-1",
        role: "owner",
      })
    );
  });

  it("returns 400 when name is empty", async () => {
    mockUser({ id: "user-1", email: "test@example.com" });
    mockRequirePlan.mockReturnValue(true);

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainSelect({ plan_tier: "pro" });
      }
      // No existing agency
      return chainSelect(null);
    });

    const req = new NextRequest("http://localhost/api/agency", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("name");
  });
});
