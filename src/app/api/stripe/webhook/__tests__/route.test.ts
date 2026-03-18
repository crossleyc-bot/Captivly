import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
vi.stubEnv("STRIPE_PRICE_STARTER", "price_starter");
vi.stubEnv("STRIPE_PRICE_GROWTH", "price_growth");
vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");

// Mock Supabase
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
const mockSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { id: "user-1" } }),
  }),
});
const mockFrom = vi.fn().mockReturnValue({
  update: mockUpdate,
  select: mockSelect,
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

// Mock Stripe
const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockSubscriptionsRetrieve },
  }),
}));

import { POST } from "../route";
import { NextRequest } from "next/server";

function createRequest(body: string, signature: string | null) {
  const headers = new Headers();
  if (signature) headers.set("stripe-signature", signature);
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
    headers,
  });
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the chained mock for update().eq()
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
  });

  it("returns 400 when signature is missing", async () => {
    const res = await POST(createRequest("{}", null));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing signature");
  });

  it("returns 400 when signature is invalid", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await POST(createRequest("{}", "bad_sig"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid signature");
  });

  it("handles checkout.session.completed — updates user plan", async () => {
    const updateEq = vi.fn().mockResolvedValue({});
    mockUpdate.mockReturnValue({ eq: updateEq });

    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          subscription: "sub_123",
          metadata: { supabase_user_id: "user-1" },
        },
      },
    });

    mockSubscriptionsRetrieve.mockResolvedValue({
      id: "sub_123",
      metadata: { supabase_user_id: "user-1" },
      items: { data: [{ price: { id: "price_growth" } }] },
    });

    const res = await POST(createRequest("{}", "valid_sig"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);

    // Should call update with growth plan
    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockUpdate).toHaveBeenCalledWith({
      stripe_subscription_id: "sub_123",
      plan_tier: "growth",
      subscription_status: "active",
    });
  });

  it("handles customer.subscription.deleted — downgrades to starter", async () => {
    const updateEq = vi.fn().mockResolvedValue({});
    mockUpdate.mockReturnValue({ eq: updateEq });

    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          metadata: { supabase_user_id: "user-1" },
        },
      },
    });

    const res = await POST(createRequest("{}", "valid_sig"));
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith({
      plan_tier: "starter",
      subscription_status: "canceled",
      stripe_subscription_id: null,
    });
  });

  it("handles invoice.payment_failed — marks as past_due", async () => {
    const updateEq = vi.fn().mockResolvedValue({});
    mockUpdate.mockReturnValue({ eq: updateEq });

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "user-1" } }),
      }),
    });

    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: {
        object: { customer: "cus_123" },
      },
    });

    const res = await POST(createRequest("{}", "valid_sig"));
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith({
      subscription_status: "past_due",
    });
  });

  it("handles customer.subscription.updated — maps status correctly", async () => {
    const updateEq = vi.fn().mockResolvedValue({});
    mockUpdate.mockReturnValue({ eq: updateEq });

    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          metadata: { supabase_user_id: "user-1" },
          status: "past_due",
          items: { data: [{ price: { id: "price_pro" } }] },
        },
      },
    });

    const res = await POST(createRequest("{}", "valid_sig"));
    expect(res.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith({
      plan_tier: "pro",
      subscription_status: "past_due",
    });
  });
});
