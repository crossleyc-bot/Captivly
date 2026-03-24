import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockFrom = vi.fn();
const mockGetUser = vi.fn();
const mockMessagesCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  })),
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
  return new NextRequest("http://localhost/api/sequences/generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/sequences/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(createRequest({ campaign_id: "c1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when campaign_id is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when business is not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // users select
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { plan_tier: "starter" } }),
            }),
          }),
        };
      }
      // businesses select
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    const res = await POST(createRequest({ campaign_id: "c1" }));
    expect(res.status).toBe(404);
  });

  it("generates a sequence successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    const aiSteps = [
      { step: 1, channel: "email", subject: "Welcome!", body: "Hi there", delay_days: 0 },
      { step: 2, channel: "email", subject: "Follow up", body: "Checking in", delay_days: 2 },
      { step: 3, channel: "email", subject: "Last chance", body: "Don't miss out", delay_days: 5 },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // users
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { plan_tier: "starter" } }),
            }),
          }),
        };
      }
      if (callCount === 2) {
        // businesses
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "b1", name: "Test Gym", type: "gym", primary_offer: "Free trial", outreach_tone: "friendly" },
              }),
            }),
          }),
        };
      }
      if (callCount === 3) {
        // campaigns
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "c1", name: "Summer Promo" } }),
              }),
            }),
          }),
        };
      }
      if (callCount === 4) {
        // sequences insert
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "seq1" }, error: null }),
            }),
          }),
        };
      }
      // sequence_steps insert
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    });

    mockMessagesCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(aiSteps) }],
    });

    const res = await POST(createRequest({ campaign_id: "c1" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sequence_id).toBe("seq1");
    expect(data.steps).toHaveLength(3);
  });
});
