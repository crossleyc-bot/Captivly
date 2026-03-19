import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
vi.stubEnv("META_VERIFY_TOKEN", "captivly_webhook_secret");
vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
vi.stubEnv("INTERNAL_API_SECRET", "test-internal-secret");

// Build a flexible Supabase mock
const mockRpc = vi.fn().mockResolvedValue({});
const mockInsert = vi.fn();
const mockSelectSingle = vi.fn();

function makeChain(resolvedValue: { data: unknown }) {
  const single = vi.fn().mockResolvedValue(resolvedValue);
  const eq = vi.fn().mockReturnValue({ single, eq: vi.fn().mockReturnValue({ single }) });
  return { select: vi.fn().mockReturnValue({ eq }), single, eq };
}

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

// Mock global fetch for Meta API calls and scoring endpoint
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { GET, POST } from "../route";
import { NextRequest } from "next/server";

describe("GET /api/meta/webhook (verification)", () => {
  it("returns challenge when token matches", async () => {
    const url = new URL("http://localhost/api/meta/webhook");
    url.searchParams.set("hub.mode", "subscribe");
    url.searchParams.set("hub.verify_token", "captivly_webhook_secret");
    url.searchParams.set("hub.challenge", "test_challenge_123");

    const req = new NextRequest(url);
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("test_challenge_123");
  });

  it("returns 403 when token does not match", async () => {
    const url = new URL("http://localhost/api/meta/webhook");
    url.searchParams.set("hub.mode", "subscribe");
    url.searchParams.set("hub.verify_token", "wrong_token");
    url.searchParams.set("hub.challenge", "test_challenge");

    const req = new NextRequest(url);
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("returns 403 when mode is not subscribe", async () => {
    const url = new URL("http://localhost/api/meta/webhook");
    url.searchParams.set("hub.mode", "unsubscribe");
    url.searchParams.set("hub.verify_token", "captivly_webhook_secret");

    const req = new NextRequest(url);
    const res = await GET(req);

    expect(res.status).toBe(403);
  });
});

describe("POST /api/meta/webhook (lead ingestion)", () => {
  let leadsCallCount: number;

  beforeEach(() => {
    vi.clearAllMocks();
    leadsCallCount = 0;

    // Default: mock the From calls in order they're made
    const businessData = {
      id: "biz-1",
      meta_access_token: "token-123",
      type: "Gym",
      primary_offer: "Free trial",
      target_age_min: 18,
      target_age_max: 65,
      target_interests: ["Fitness"],
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "businesses") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: businessData }),
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: businessData }),
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
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { plan_tier: "growth", user_id: "user-1" } }),
            }),
          }),
        };
      }
      if (table === "usage_tracking") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { leads_count: 10 } }),
              }),
            }),
          }),
        };
      }
      if (table === "leads") {
        // First call is dedup check, subsequent calls are insert
        if (!leadsCallCount) {
          leadsCallCount++;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0 }),
            }),
          };
        }
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "lead-1" },
              }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn() }) };
    });

    // Mock Meta API response for lead data
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("graph.facebook.com")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              field_data: [
                { name: "full_name", values: ["John Smith"] },
                { name: "email", values: ["john@example.com"] },
                { name: "phone_number", values: ["+1234567890"] },
              ],
            }),
        });
      }
      // Scoring endpoint
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("returns 200 for non-page objects", async () => {
    const req = new NextRequest("http://localhost/api/meta/webhook", {
      method: "POST",
      body: JSON.stringify({ object: "user", entry: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it("processes valid lead data and triggers scoring", async () => {
    const req = new NextRequest("http://localhost/api/meta/webhook", {
      method: "POST",
      body: JSON.stringify({
        object: "page",
        entry: [
          {
            changes: [
              {
                field: "leadgen",
                value: {
                  form_id: "form-1",
                  leadgen_id: "lead-meta-1",
                  page_id: "page-1",
                  created_time: Date.now(),
                },
              },
            ],
          },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Should have fetched lead data from Meta
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("graph.facebook.com")
    );

    // Should have called scoring endpoint
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/leads/score",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("skips non-leadgen changes", async () => {
    const req = new NextRequest("http://localhost/api/meta/webhook", {
      method: "POST",
      body: JSON.stringify({
        object: "page",
        entry: [
          {
            changes: [
              {
                field: "feed",
                value: { item: "post" },
              },
            ],
          },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // Should NOT have called Meta API
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
