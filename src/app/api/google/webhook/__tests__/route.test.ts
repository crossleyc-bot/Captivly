import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

// Build a flexible Supabase mock
const mockRpc = vi.fn().mockResolvedValue({});
const mockFrom = vi.fn();

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

vi.mock("@/lib/internal-auth", () => ({
  getInternalAuthHeader: vi.fn(() => ({ Authorization: "Bearer test" })),
}));

// Mock global fetch for scoring endpoint
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { POST } from "../route";
import { NextRequest } from "next/server";

function encodePubSub(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function makePubSubRequest(data?: string) {
  return new NextRequest("http://localhost/api/google/webhook", {
    method: "POST",
    body: JSON.stringify({
      message: {
        data,
        messageId: "123",
        publishTime: "2026-03-01T00:00:00Z",
      },
      subscription: "projects/test/subscriptions/test",
    }),
  });
}

const validLeadPayload = {
  google_lead_id: "gl-123",
  campaign_id: "gc-1",
  form_id: "gf-1",
  customer_id: "cust-1",
  user_column_data: [
    { column_id: "FULL_NAME", string_value: "John Smith" },
    { column_id: "EMAIL", string_value: "john@example.com" },
    { column_id: "PHONE_NUMBER", string_value: "+1234567890" },
  ],
};

const businessData = {
  id: "biz-1",
  google_access_token: "gtoken-123",
  google_refresh_token: "grefresh-123",
  type: "Gym",
  primary_offer: "Free trial",
  target_age_min: 18,
  target_age_max: 65,
  target_interests: ["Fitness"],
};

describe("POST /api/google/webhook (Google Pub/Sub lead ingestion)", () => {
  let leadsCallCount: number;
  let mockInsert: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    leadsCallCount = 0;
    mockInsert = vi.fn();

    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: businessData }),
            }),
          }),
        };
      }
      if (table === "campaigns") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "camp-1" } }),
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
                data: { plan_tier: "growth", user_id: "user-1" },
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
                  data: { leads_count: 10 },
                }),
              }),
            }),
          }),
        };
      }
      if (table === "leads") {
        if (!leadsCallCount) {
          leadsCallCount++;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0 }),
            }),
          };
        }
        mockInsert.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "lead-1" },
            }),
          }),
        });
        return { insert: mockInsert };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn() }) };
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it("returns 400 when message data is missing", async () => {
    const req = new NextRequest("http://localhost/api/google/webhook", {
      method: "POST",
      body: JSON.stringify({
        message: { messageId: "123", publishTime: "2026-03-01T00:00:00Z" },
        subscription: "projects/test/subscriptions/test",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing message data");
  });

  it("returns 400 when payload is invalid base64/JSON", async () => {
    const req = makePubSubRequest("not-valid-base64-json!!!");

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid payload");
  });

  it("returns 200 silently when google_lead_id is missing", async () => {
    const payload = { ...validLeadPayload, google_lead_id: "" };
    const req = makePubSubRequest(encodePubSub(payload));

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
    // Should not have queried Supabase
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 200 silently when customer_id is missing", async () => {
    const payload = { ...validLeadPayload, customer_id: "" };
    const req = makePubSubRequest(encodePubSub(payload));

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 200 when business is not found for given customer_id", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn() }) };
    });

    const req = makePubSubRequest(encodePubSub(validLeadPayload));

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it("deduplicates: returns 200 when google_lead_id already exists", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: businessData }),
            }),
          }),
        };
      }
      if (table === "leads") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 1 }),
          }),
        };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn() }) };
    });

    const req = makePubSubRequest(encodePubSub(validLeadPayload));

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
    // Should not have inserted a lead
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("successfully processes a valid lead: inserts lead, calls increment_usage rpc, triggers scoring", async () => {
    const req = makePubSubRequest(encodePubSub(validLeadPayload));

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);

    // Should have inserted the lead
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: "biz-1",
        google_lead_id: "gl-123",
        first_name: "John",
        last_name: "Smith",
        email: "john@example.com",
        phone: "+1234567890",
        source: "google",
        status: "new",
      })
    );

    // Should have called increment_usage rpc
    expect(mockRpc).toHaveBeenCalledWith("increment_usage", {
      p_business_id: "biz-1",
      p_month: expect.stringMatching(/^\d{4}-\d{2}$/),
      p_field: "leads_count",
    });

    // Should have called increment_campaign_leads rpc
    expect(mockRpc).toHaveBeenCalledWith("increment_campaign_leads", {
      p_campaign_id: "camp-1",
    });

    // Should have triggered scoring endpoint
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/leads/score",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("blocks lead when usage limit is reached", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: businessData }),
            }),
          }),
        };
      }
      if (table === "leads") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 0 }),
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
      if (table === "campaigns") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "camp-1" } }),
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
                  data: { leads_count: 100 }, // starter limit is 100
                }),
              }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn() }) };
    });

    const req = makePubSubRequest(encodePubSub(validLeadPayload));

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);

    // Should NOT have inserted a lead or triggered scoring
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("parses user_column_data correctly (full_name splits into first/last, email, phone_number)", async () => {
    const payload = {
      ...validLeadPayload,
      user_column_data: [
        { column_id: "FULL_NAME", string_value: "Jane Marie Doe" },
        { column_id: "EMAIL", string_value: "jane@test.com" },
        { column_id: "PHONE_NUMBER", string_value: "+9876543210" },
      ],
    };

    const req = makePubSubRequest(encodePubSub(payload));

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify first_name is the first word and last_name is the rest
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Jane",
        last_name: "Marie Doe",
        email: "jane@test.com",
        phone: "+9876543210",
      })
    );
  });
});
