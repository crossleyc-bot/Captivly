import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockFrom = vi.fn();
const mockMessagesCreate = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/anthropic", () => ({
  getAnthropicClient: vi.fn(() => ({
    messages: { create: mockMessagesCreate },
  })),
  AI_MODEL: "claude-sonnet-4-20250514",
}));

import { POST } from "../route";
import { NextRequest } from "next/server";

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when business_id is missing", async () => {
    const res = await POST(createRequest({ message: "Hi" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when message is missing", async () => {
    const res = await POST(createRequest({ business_id: "b1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when message exceeds max length", async () => {
    const res = await POST(
      createRequest({ business_id: "b1", message: "x".repeat(501) })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when business not found", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });
    const res = await POST(createRequest({ business_id: "bad", message: "Hi" }));
    expect(res.status).toBe(404);
  });

  it("returns 500 when Claude API fails", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // businesses
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "b1", name: "Test Gym", type: "gym", primary_offer: null, user_id: "u1" },
              }),
            }),
          }),
        };
      }
      if (callCount === 2) {
        // users (plan check)
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { plan_tier: "pro", subscription_status: "active" },
              }),
            }),
          }),
        };
      }
      // chat_widget_config
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { is_enabled: true } }),
          }),
        }),
      };
    });

    mockMessagesCreate.mockRejectedValue(new Error("API rate limit"));

    const res = await POST(createRequest({ business_id: "b1", message: "Hi" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("Failed to generate response");
  });
});
