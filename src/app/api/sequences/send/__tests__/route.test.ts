import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockRpc = vi.fn().mockResolvedValue({});
const mockFrom = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

// Mock Resend
const mockResendSend = vi.fn().mockResolvedValue({ data: { id: "resend-msg-1" } });
vi.mock("@/lib/resend", () => ({
  getResendClient: () => ({
    emails: { send: mockResendSend },
  }),
}));

// Mock Twilio
const mockTwilioCreate = vi.fn().mockResolvedValue({ sid: "twilio-sid-1" });
vi.mock("@/lib/twilio", () => ({
  getTwilioClient: () => ({
    messages: { create: mockTwilioCreate },
  }),
  TWILIO_FROM: "+15555555555",
}));

import { POST } from "../route";
import { NextRequest } from "next/server";

function createRequest(body: Record<string, unknown>, includeAuth = true) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (includeAuth) {
    headers["Authorization"] = "Bearer test-internal-secret";
  }
  return new NextRequest("http://localhost/api/sequences/send", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}

describe("POST /api/sequences/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
  });

  it("returns 401 when no auth header is provided", async () => {
    const res = await POST(createRequest({ message_id: "msg-1" }, false));
    expect(res.status).toBe(401);
  });

  it("returns 401 when auth header has wrong secret", async () => {
    const req = new NextRequest("http://localhost/api/sequences/send", {
      method: "POST",
      body: JSON.stringify({ message_id: "msg-1" }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer wrong-secret",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when message_id is missing", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("message_id required");
  });

  it("returns 404 when message not found", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });

    const res = await POST(createRequest({ message_id: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when message already processed", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "msg-1", status: "sent", lead: {}, step: {} },
          }),
        }),
      }),
    });

    const res = await POST(createRequest({ message_id: "msg-1" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Message already processed");
  });

  it("sends email via Resend and returns success", async () => {
    // First call: messages_sent select; subsequent calls: update/other
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "messages_sent" && callCount === 0) {
        callCount++;
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "msg-1",
                  status: "queued",
                  lead: {
                    id: "lead-1",
                    business_id: "biz-1",
                    email: "john@example.com",
                    phone: null,
                    status: "new",
                  },
                  step: {
                    channel: "email",
                    subject: "Welcome!",
                    body: "Hello John",
                  },
                },
              }),
            }),
          }),
        };
      }
      // For updates and other queries
      return {
        update: mockUpdate,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    const res = await POST(createRequest({ message_id: "msg-1" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sent).toBe(true);
    expect(data.provider_message_id).toBe("resend-msg-1");

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "john@example.com",
        subject: "Welcome!",
        html: expect.stringContaining("Hello John"),
      })
    );
  });

  it("sends SMS via Twilio when channel is sms", async () => {
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "messages_sent" && callCount === 0) {
        callCount++;
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "msg-2",
                  status: "queued",
                  lead: {
                    id: "lead-2",
                    business_id: "biz-1",
                    email: null,
                    phone: "+1234567890",
                    status: "in_sequence",
                  },
                  step: {
                    channel: "sms",
                    subject: null,
                    body: "Hey! Check out our offer",
                  },
                },
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
                data: { id: "biz-1", user_id: "user-1" },
              }),
            }),
          }),
        };
      }
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
      if (table === "usage_tracking") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { sms_count: 100 },
                }),
              }),
            }),
          }),
        };
      }
      return {
        update: mockUpdate,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    const res = await POST(createRequest({ message_id: "msg-2" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sent).toBe(true);

    expect(mockTwilioCreate).toHaveBeenCalledWith({
      body: "Hey! Check out our offer",
      from: "+15555555555",
      to: "+1234567890",
    });
  });

  it("blocks SMS when plan limit reached (403)", async () => {
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "messages_sent" && callCount === 0) {
        callCount++;
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "msg-3",
                  status: "queued",
                  lead: {
                    id: "lead-3",
                    business_id: "biz-1",
                    email: null,
                    phone: "+1234567890",
                    status: "new",
                  },
                  step: { channel: "sms", subject: null, body: "Hi" },
                },
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
                data: { id: "biz-1", user_id: "user-1" },
              }),
            }),
          }),
        };
      }
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { plan_tier: "starter" },
              }),
            }),
          }),
        };
      }
      if (table === "usage_tracking") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { sms_count: 0 },
                }),
              }),
            }),
          }),
        };
      }
      return {
        update: mockUpdate,
      };
    });

    const res = await POST(createRequest({ message_id: "msg-3" }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("SMS limit reached");
  });
});
