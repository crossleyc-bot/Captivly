import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  })),
}));

import { GET, POST } from "../route";
import { NextRequest } from "next/server";

function createGetRequest() {
  return new NextRequest("http://localhost/api/support/tickets");
}

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/support/tickets", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/support/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns tickets for authenticated user", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
      const mockTickets = [{ id: "t1", subject: "Help" }];
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockTickets, error: null }),
          }),
        }),
      });

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockTickets);
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const res = await POST(createPostRequest({ subject: "Help", message: "Please" }));
      expect(res.status).toBe(401);
    });

    it("returns 400 when subject is missing", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
      const res = await POST(createPostRequest({ message: "Please" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when message is missing", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
      const res = await POST(createPostRequest({ subject: "Help" }));
      expect(res.status).toBe(400);
    });

    it("returns 201 on valid ticket submission", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
      const mockTicket = { id: "t1", subject: "Help", status: "open" };

      // Business lookup
      const businessSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "b1" } }),
        }),
      });
      // Ticket insert
      const ticketInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTicket, error: null }),
        }),
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return { select: businessSelect };
        return { insert: ticketInsert };
      });

      const res = await POST(
        createPostRequest({ subject: "Help", message: "I need help", urgency: "high" })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBe("t1");
    });
  });
});
