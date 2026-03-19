import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

// --- Supabase mock ---
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

// --- Internal auth mock ---
const mockValidateInternalAuth = vi.fn();

vi.mock("@/lib/internal-auth", () => ({
  validateInternalAuth: (...args: unknown[]) => mockValidateInternalAuth(...args),
}));

// --- Anthropic mock ---
const mockMessagesCreate = vi.fn();

vi.mock("@/lib/anthropic", () => ({
  getAnthropicClient: vi.fn(() => ({
    messages: { create: mockMessagesCreate },
  })),
  AI_MODEL: "claude-sonnet-4-20250514",
}));

// --- Resend mock ---
const mockEmailsSend = vi.fn();

vi.mock("@/lib/resend", () => ({
  getResendClient: vi.fn(() => ({
    emails: { send: mockEmailsSend },
  })),
}));

import { POST } from "../route";
import { NextRequest, NextResponse } from "next/server";

function createRequest() {
  return new NextRequest("http://localhost/api/reports/generate", {
    method: "POST",
  });
}

describe("POST /api/reports/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without internal auth header", async () => {
    mockValidateInternalAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const res = await POST(createRequest());
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns { generated: 0 } when no pro users exist", async () => {
    mockValidateInternalAuth.mockReturnValue(null);

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(createRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.generated).toBe(0);
  });

  it("generates report for pro user: calls Anthropic, saves to report_cards, emails via Resend", async () => {
    mockValidateInternalAuth.mockReturnValue(null);

    const proUser = { id: "user-1", email: "owner@gym.com", full_name: "Jane Doe" };
    const business = { id: "biz-1", name: "FitGym", type: "gym", primary_offer: "Free 7-day trial" };

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [proUser] }),
            }),
          }),
        };
      }
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: business }),
            }),
          }),
        };
      }
      if (table === "report_cards") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({}),
        };
      }
      if (table === "usage_tracking") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { leads_count: 50, sms_count: 20, emails_count: 45 },
                }),
              }),
            }),
          }),
        };
      }
      if (table === "leads") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockResolvedValue({
                  data: [
                    { ai_score: 8, status: "converted", created_at: "2026-02-15" },
                    { ai_score: 6, status: "replied", created_at: "2026-02-10" },
                  ],
                }),
              }),
            }),
          }),
        };
      }
      if (table === "conversions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockResolvedValue({ count: 5 }),
              }),
            }),
          }),
        };
      }
      if (table === "messages_sent") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockResolvedValue({
                  data: [
                    { status: "sent", channel: "email" },
                    { status: "delivered", channel: "sms" },
                  ],
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const reportJson = JSON.stringify({
      summary: "Great month for FitGym!",
      top_insight: "Lead quality improved by 20%.",
      recommendation: "Consider increasing your ad budget.",
    });

    mockMessagesCreate.mockResolvedValue({
      content: [{ type: "text", text: reportJson }],
    });

    mockEmailsSend.mockResolvedValue({ data: { id: "msg-1" } });

    const res = await POST(createRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.generated).toBe(1);

    // Verify Anthropic was called
    expect(mockMessagesCreate).toHaveBeenCalledOnce();
    expect(mockMessagesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
      })
    );

    // Verify report was saved to report_cards
    expect(mockFrom).toHaveBeenCalledWith("report_cards");

    // Verify email was sent via Resend
    expect(mockEmailsSend).toHaveBeenCalledOnce();
    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@gym.com",
        subject: expect.stringContaining("FitGym"),
      })
    );
  });

  it("skips business that already has a report for the month", async () => {
    mockValidateInternalAuth.mockReturnValue(null);

    const proUser = { id: "user-2", email: "owner2@salon.com", full_name: "Bob" };
    const business = { id: "biz-2", name: "GlowSalon", type: "salon", primary_offer: "50% off first visit" };

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [proUser] }),
            }),
          }),
        };
      }
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: business }),
            }),
          }),
        };
      }
      if (table === "report_cards") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "existing-report" } }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({}),
        };
      }
      return {};
    });

    const res = await POST(createRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.generated).toBe(0);

    // Should NOT have called Anthropic or Resend
    expect(mockMessagesCreate).not.toHaveBeenCalled();
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });
});
