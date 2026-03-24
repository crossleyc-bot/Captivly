import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockFrom = vi.fn();
const mockValidateInternalAuth = vi.fn();
const mockMessagesCreate = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/internal-auth", () => ({
  validateInternalAuth: (...args: unknown[]) => mockValidateInternalAuth(...args),
}));

vi.mock("@/lib/anthropic", () => ({
  getAnthropicClient: vi.fn(() => ({
    messages: { create: mockMessagesCreate },
  })),
  AI_MODEL: "claude-sonnet-4-20250514",
}));

vi.mock("@/lib/lead-enrichment", () => ({
  enrichLead: vi.fn(() => ({ email_type: "professional" })),
  formatEnrichmentForScoring: vi.fn(() => "Email type: professional"),
}));

import { POST } from "../route";
import { NextRequest, NextResponse } from "next/server";

function createRequest(body: Record<string, unknown>, includeAuth = true) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (includeAuth) headers["Authorization"] = "Bearer test-internal-secret";
  return new NextRequest("http://localhost/api/leads/score", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}

describe("POST /api/leads/score", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateInternalAuth.mockReturnValue(null);
  });

  it("returns 401 without internal auth", async () => {
    mockValidateInternalAuth.mockReturnValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const res = await POST(createRequest({ lead_id: "l1" }, false));
    expect(res.status).toBe(401);
  });

  it("returns 400 when lead_id is missing", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when lead is not found", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });
    const res = await POST(createRequest({ lead_id: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("scores a lead successfully", async () => {
    const mockLead = {
      id: "l1",
      business_id: "b1",
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      phone: "+1234567890",
      custom_answers: null,
      source: "meta",
    };
    const mockBusiness = {
      type: "gym",
      location_city: "Austin",
      location_state: "TX",
      target_age_min: 25,
      target_age_max: 45,
      target_interests: ["fitness"],
      primary_offer: "Free trial",
    };

    let fromCallCount = 0;
    mockFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) {
        // leads select
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockLead }),
            }),
          }),
        };
      }
      if (fromCallCount === 2) {
        // businesses select
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockBusiness }),
            }),
          }),
        };
      }
      // update calls
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({}),
        }),
      };
    });

    mockMessagesCreate.mockResolvedValue({
      content: [{ type: "text", text: '{"score": 8, "reason": "Strong local fit"}' }],
    });

    const res = await POST(createRequest({ lead_id: "l1" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.score).toBe(8);
    expect(data.reason).toBe("Strong local fit");
  });
});
