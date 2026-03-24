import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockFrom = vi.fn();
const mockGetUser = vi.fn();
const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(() => ({
    customers: { create: mockCustomersCreate },
    checkout: { sessions: { create: mockCheckoutSessionsCreate } },
  })),
  STRIPE_PRICES: {
    starter: "price_starter",
    growth: "price_growth",
    pro: "price_pro",
  },
}));

import { POST } from "../route";
import { NextRequest } from "next/server";

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/stripe/create-checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/stripe/create-checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(createRequest({ plan: "starter" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid plan", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await POST(createRequest({ plan: "invalid" }));
    expect(res.status).toBe(400);
  });

  it("creates checkout session for existing Stripe customer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: "cus_existing", email: "a@b.com" },
          }),
        }),
      }),
    });
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session123",
    });

    const res = await POST(createRequest({ plan: "growth" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://checkout.stripe.com/session123");
    expect(mockCustomersCreate).not.toHaveBeenCalled();
  });

  it("creates Stripe customer when none exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } } });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // users select
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { stripe_customer_id: null, email: "a@b.com" },
              }),
            }),
          }),
        };
      }
      // users update
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({}),
        }),
      };
    });

    mockCustomersCreate.mockResolvedValue({ id: "cus_new" });
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session456",
    });

    const res = await POST(createRequest({ plan: "starter" }));
    expect(res.status).toBe(200);
    expect(mockCustomersCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.com" })
    );
  });
});
