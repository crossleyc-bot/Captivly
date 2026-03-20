import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockFrom = vi.fn();
const mockAuthGetUser = vi.fn();
const mockServiceFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({
    from: mockServiceFrom,
  })),
}));

vi.mock("@/lib/api-key-auth", () => ({
  generateApiKey: vi.fn(() => ({
    key: "captv_test123",
    hash: "hash123",
    prefix: "captv_te",
  })),
}));

import { GET, POST, DELETE } from "../keys/route";
import { NextRequest } from "next/server";

describe("GET /api/zapier/keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns list of API keys", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const mockKeys = [
      { id: "key-1", key_prefix: "captv_ab", name: "My Key", last_used_at: null, created_at: "2026-03-01" },
    ];

    const orderFn = vi.fn().mockResolvedValue({ data: mockKeys });
    const eqFn = vi.fn().mockReturnValue({ order: orderFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValue({ select: selectFn });

    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockKeys);
  });
});

describe("POST /api/zapier/keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest("http://localhost/api/zapier/keys", {
      method: "POST",
      body: JSON.stringify({ name: "Test Key" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("creates a new API key and returns full key", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    mockServiceFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    const req = new NextRequest("http://localhost/api/zapier/keys", {
      method: "POST",
      body: JSON.stringify({ name: "My Integration" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.key).toBe("captv_test123");
    expect(data.prefix).toBe("captv_te");
    expect(data.name).toBe("My Integration");

    expect(mockServiceFrom).toHaveBeenCalledWith("api_keys");
  });
});

describe("DELETE /api/zapier/keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest("http://localhost/api/zapier/keys", {
      method: "DELETE",
      body: JSON.stringify({ id: "key-1" }),
    });
    const res = await DELETE(req);

    expect(res.status).toBe(401);
  });

  it("requires id parameter", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const req = new NextRequest("http://localhost/api/zapier/keys", {
      method: "DELETE",
      body: JSON.stringify({}),
    });
    const res = await DELETE(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("id required");
  });

  it("removes the key", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const eqUserFn = vi.fn().mockResolvedValue({});
    const eqIdFn = vi.fn().mockReturnValue({ eq: eqUserFn });
    const deleteFn = vi.fn().mockReturnValue({ eq: eqIdFn });
    mockFrom.mockReturnValue({ delete: deleteFn });

    const req = new NextRequest("http://localhost/api/zapier/keys", {
      method: "DELETE",
      body: JSON.stringify({ id: "key-1" }),
    });
    const res = await DELETE(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("api_keys");
  });
});
