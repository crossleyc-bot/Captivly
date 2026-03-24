import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockInsert = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

import { POST } from "../route";
import { NextRequest } from "next/server";

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      insert: mockInsert.mockReturnValue({ error: null }),
    });
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(createRequest({ email: "a@b.com", message: "hi" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(createRequest({ name: "Joe", email: "bad", message: "hi" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when message is missing", async () => {
    const res = await POST(createRequest({ name: "Joe", email: "a@b.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 on valid submission", async () => {
    const res = await POST(
      createRequest({ name: "Joe", email: "joe@example.com", message: "Help me" })
    );
    expect(res.status).toBe(201);
    expect(mockFrom).toHaveBeenCalledWith("contact_submissions");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Joe",
        email: "joe@example.com",
        message: "Help me",
      })
    );
  });

  it("returns 500 when database insert fails", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({ error: { message: "DB error" } }),
    });
    const res = await POST(
      createRequest({ name: "Joe", email: "joe@example.com", message: "Help" })
    );
    expect(res.status).toBe(500);
  });
});
