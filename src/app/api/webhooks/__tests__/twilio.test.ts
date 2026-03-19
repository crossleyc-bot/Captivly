import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();
vi.stubEnv("TWILIO_AUTH_TOKEN", "test-token");

// --- Supabase mock ---
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

// --- Reply handler mock ---
const mockHandleLeadReply = vi.fn();

vi.mock("@/lib/reply-handler", () => ({
  handleLeadReply: (...args: unknown[]) => mockHandleLeadReply(...args),
}));

import { POST } from "@/app/api/webhooks/twilio/route";
import { NextRequest } from "next/server";

const AUTH_TOKEN = "test-token";
const WEBHOOK_URL = "http://localhost:3000/api/webhooks/twilio";

/** Compute a valid Twilio HMAC-SHA1 signature for the given params. */
function computeTwilioSignature(params: Record<string, string>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], "");
  const dataToSign = WEBHOOK_URL + sortedParams;
  return createHmac("sha1", AUTH_TOKEN).update(dataToSign).digest("base64");
}

function createTwilioRequest(
  params: Record<string, string>,
  headers?: Record<string, string>
) {
  const body = new URLSearchParams(params).toString();
  // Auto-compute valid signature unless headers are explicitly provided without one
  const sig = headers?.["x-twilio-signature"] === undefined
    ? undefined
    : headers["x-twilio-signature"] === "valid-sig"
      ? computeTwilioSignature(params)
      : headers["x-twilio-signature"];
  const reqHeaders = new Headers({
    "Content-Type": "application/x-www-form-urlencoded",
    ...headers,
    ...(sig !== undefined ? { "x-twilio-signature": sig } : {}),
  });
  return new NextRequest("http://localhost/api/webhooks/twilio", {
    method: "POST",
    body,
    headers: reqHeaders,
  });
}

describe("POST /api/webhooks/twilio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("TWILIO_AUTH_TOKEN", "test-token");
  });

  it("returns 401 when x-twilio-signature header is missing", async () => {
    const req = createTwilioRequest(
      { From: "+15551234567", Body: "Yes I'm interested" },
      {} // no signature
    );

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Missing signature");
  });

  it("returns 500 when TWILIO_AUTH_TOKEN not configured", async () => {
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");

    const req = createTwilioRequest(
      { From: "+15551234567", Body: "Hello" },
      { "x-twilio-signature": "some-sig" }
    );

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Not configured");
  });

  it("returns empty TwiML when From is missing", async () => {
    const req = createTwilioRequest(
      { Body: "Hello" },
      { "x-twilio-signature": "valid-sig" }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("<Response></Response>");
    expect(res.headers.get("Content-Type")).toBe("text/xml");
  });

  it("finds lead by exact phone match and calls handleLeadReply", async () => {
    const leadId = "lead-exact-1";

    mockFrom.mockImplementation((table: string) => {
      if (table === "leads") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: leadId } }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "messages_sent") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: { id: "msg-sms-1" },
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    mockHandleLeadReply.mockResolvedValue({ paused: true, cancelledCount: 2 });

    const req = createTwilioRequest(
      { From: "+15551234567", Body: "Yes, sign me up!" },
      { "x-twilio-signature": "valid-sig" }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockHandleLeadReply).toHaveBeenCalledOnce();
    expect(mockHandleLeadReply).toHaveBeenCalledWith({
      leadId,
      messageId: "msg-sms-1",
      channel: "sms",
    });
  });

  it("finds lead by E.164 format (+1XXXXXXXXXX) when exact match fails", async () => {
    const leadId = "lead-e164-1";
    let leadQueryCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "leads") {
        leadQueryCount++;
        if (leadQueryCount === 1) {
          // First query: exact match fails
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (leadQueryCount === 2) {
          // Second query: E.164 match succeeds
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: leadId } }),
                  }),
                }),
              }),
            }),
          };
        }
        // Any further queries
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "messages_sent") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: { id: "msg-sms-2" },
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    mockHandleLeadReply.mockResolvedValue({ paused: true, cancelledCount: 1 });

    const req = createTwilioRequest(
      { From: "5551234567", Body: "Interested!" },
      { "x-twilio-signature": "valid-sig" }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockHandleLeadReply).toHaveBeenCalledOnce();
    expect(mockHandleLeadReply).toHaveBeenCalledWith({
      leadId,
      messageId: "msg-sms-2",
      channel: "sms",
    });
  });

  it("returns empty TwiML response (XML) regardless of match", async () => {
    // No lead match at all
    mockFrom.mockImplementation((table: string) => {
      if (table === "leads") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = createTwilioRequest(
      { From: "+10000000000", Body: "Hello" },
      { "x-twilio-signature": "valid-sig" }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    expect(res.headers.get("Content-Type")).toBe("text/xml");

    // Should NOT have called handleLeadReply
    expect(mockHandleLeadReply).not.toHaveBeenCalled();
  });
});
