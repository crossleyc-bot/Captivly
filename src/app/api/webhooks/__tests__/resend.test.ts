import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

vi.stubEnv("RESEND_WEBHOOK_SECRET", "test-secret");

// Mock Supabase
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }) });
const mockSingle = vi.fn().mockResolvedValue({ data: null });
const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
const mockIn = vi.fn().mockReturnValue({ order: mockOrder, single: mockSingle });
const mockEq = vi.fn().mockReturnValue({ in: mockIn, eq: vi.fn().mockResolvedValue({}) });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({
  update: mockUpdate,
  select: mockSelect,
});

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

// Mock reply handler
vi.mock("@/lib/reply-handler", () => ({
  handleLeadReply: vi.fn().mockResolvedValue({ paused: true, cancelledCount: 2 }),
}));

import { POST } from "../resend/route";
import { handleLeadReply } from "@/lib/reply-handler";
import { NextRequest } from "next/server";

const mockHandleLeadReply = vi.mocked(handleLeadReply);

function createRequest(body: Record<string, unknown>, headers?: Record<string, string>) {
  const reqHeaders = new Headers();
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      reqHeaders.set(key, value);
    }
  }
  return new NextRequest("http://localhost/api/webhooks/resend", {
    method: "POST",
    body: JSON.stringify(body),
    headers: reqHeaders,
  });
}

describe("POST /api/webhooks/resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chained mocks
    mockUpdate.mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }) });
  });

  it("returns 401 when svix-signature header is missing", async () => {
    const res = await POST(createRequest({ type: "email.delivered", data: {} }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Missing signature");
  });

  it("handles email.delivered - updates messages_sent status to delivered", async () => {
    const innerEq = vi.fn().mockResolvedValue({});
    const outerEq = vi.fn().mockReturnValue({ eq: innerEq });
    mockUpdate.mockReturnValue({ eq: outerEq });

    const event = {
      type: "email.delivered",
      created_at: "2026-03-19T10:00:00Z",
      data: {
        email_id: "email-123",
        from: "noreply@captivly.ai",
        to: ["lead@example.com"],
        subject: "Welcome!",
      },
    };

    const res = await POST(createRequest(event, { "svix-signature": "valid-sig" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);

    expect(mockFrom).toHaveBeenCalledWith("messages_sent");
    expect(mockUpdate).toHaveBeenCalledWith({
      status: "delivered",
      delivered_at: "2026-03-19T10:00:00Z",
    });
    expect(outerEq).toHaveBeenCalledWith("provider_message_id", "email-123");
    expect(innerEq).toHaveBeenCalledWith("status", "sent");
  });

  it("handles email.bounced - updates messages_sent status to failed", async () => {
    const eqFn = vi.fn().mockResolvedValue({});
    mockUpdate.mockReturnValue({ eq: eqFn });

    const event = {
      type: "email.bounced",
      created_at: "2026-03-19T10:00:00Z",
      data: {
        email_id: "email-456",
        from: "noreply@captivly.ai",
        to: ["bounce@example.com"],
        subject: "Hello",
      },
    };

    const res = await POST(createRequest(event, { "svix-signature": "valid-sig" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);

    expect(mockFrom).toHaveBeenCalledWith("messages_sent");
    expect(mockUpdate).toHaveBeenCalledWith({ status: "failed" });
    expect(eqFn).toHaveBeenCalledWith("provider_message_id", "email-456");
  });

  it("handles email.received - finds lead by sender email and calls handleLeadReply", async () => {
    // First call: leads.select().eq().in().single() -> find lead
    const leadSingle = vi.fn().mockResolvedValue({ data: { id: "lead-1" } });
    const leadIn = vi.fn().mockReturnValue({ single: leadSingle });
    const leadEq = vi.fn().mockReturnValue({ in: leadIn });
    const leadSelect = vi.fn().mockReturnValue({ eq: leadEq });

    // Second call: messages_sent.select().eq().eq().in().order().limit().single() -> find last message
    const msgSingle = vi.fn().mockResolvedValue({ data: { id: "msg-1" } });
    const msgLimit = vi.fn().mockReturnValue({ single: msgSingle });
    const msgOrder = vi.fn().mockReturnValue({ limit: msgLimit });
    const msgIn = vi.fn().mockReturnValue({ order: msgOrder });
    const msgEq2 = vi.fn().mockReturnValue({ in: msgIn });
    const msgEq1 = vi.fn().mockReturnValue({ eq: msgEq2 });
    const msgSelect = vi.fn().mockReturnValue({ eq: msgEq1 });

    mockFrom.mockImplementation((table: string) => {
      if (table === "leads") {
        return { select: leadSelect };
      }
      if (table === "messages_sent") {
        return { select: msgSelect };
      }
      return { select: mockSelect, update: mockUpdate };
    });

    const event = {
      type: "email.received",
      created_at: "2026-03-19T12:00:00Z",
      data: {
        email_id: "email-789",
        from: "lead@example.com",
        to: ["outreach@captivly.ai"],
        subject: "Re: Welcome!",
      },
    };

    const res = await POST(createRequest(event, { "svix-signature": "valid-sig" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);

    expect(mockFrom).toHaveBeenCalledWith("leads");
    expect(leadEq).toHaveBeenCalledWith("email", "lead@example.com");

    expect(mockHandleLeadReply).toHaveBeenCalledWith({
      leadId: "lead-1",
      messageId: "msg-1",
      channel: "email",
      repliedAt: "2026-03-19T12:00:00Z",
    });
  });

  it("returns {received:true} for unknown event types", async () => {
    const event = {
      type: "email.some_unknown_event",
      created_at: "2026-03-19T10:00:00Z",
      data: {
        email_id: "email-000",
        from: "noreply@captivly.ai",
        to: ["someone@example.com"],
        subject: "Test",
      },
    };

    const res = await POST(createRequest(event, { "svix-signature": "valid-sig" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });
});
