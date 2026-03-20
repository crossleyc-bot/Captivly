import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

// --- Supabase mock ---
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

// --- Stripe mock ---
const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();
const mockBillingPortalSessionsCreate = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    customers: { create: mockCustomersCreate },
    checkout: { sessions: { create: mockCheckoutSessionsCreate } },
    billingPortal: { sessions: { create: mockBillingPortalSessionsCreate } },
  }),
  STRIPE_PRICES: {
    starter: "price_starter",
    growth: "price_growth",
    pro: "price_pro",
  },
}));

import { POST as createCheckout } from "@/app/api/stripe/create-checkout/route";
import { POST as portal } from "@/app/api/stripe/portal/route";
import { NextRequest } from "next/server";

function createCheckoutRequest(body: Record<string, unknown>) {
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

    const res = await createCheckout(createCheckoutRequest({ plan: "starter" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid plan", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1", email: "test@test.com" } } });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: "cus_123", email: "test@test.com" },
          }),
        }),
      }),
    });

    const res = await createCheckout(createCheckoutRequest({ plan: "enterprise" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid plan");
  });

  it("creates checkout session for valid plan", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1", email: "test@test.com" } } });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: "cus_existing", email: "test@test.com" },
          }),
        }),
      }),
    });

    mockCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session/123",
    });

    const res = await createCheckout(createCheckoutRequest({ plan: "growth" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://checkout.stripe.com/session/123");

    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_existing",
        mode: "subscription",
        line_items: [{ price: "price_growth", quantity: 1 }],
      })
    );
  });

  it("creates Stripe customer if none exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-2", email: "new@test.com" } } });

    const mockUpdateEq = vi.fn().mockResolvedValue({});

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { stripe_customer_id: null, email: "new@test.com" },
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: mockUpdateEq,
          }),
        };
      }
      return {};
    });

    mockCustomersCreate.mockResolvedValue({ id: "cus_new_123" });
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session/456",
    });

    const res = await createCheckout(createCheckoutRequest({ plan: "starter" }));
    expect(res.status).toBe(200);

    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: "new@test.com",
      metadata: { supabase_user_id: "user-2" },
    });

    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_new_123",
      })
    );
  });
});

describe("POST /api/stripe/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new NextRequest("http://localhost/api/stripe/portal", {
      method: "POST",
    });
    const res = await portal(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when no stripe_customer_id", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: null },
          }),
        }),
      }),
    });

    const req = new NextRequest("http://localhost/api/stripe/portal", {
      method: "POST",
    });
    const res = await portal(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("No billing account");
  });

  it("returns portal URL", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: "cus_portal_123" },
          }),
        }),
      }),
    });

    mockBillingPortalSessionsCreate.mockResolvedValue({
      url: "https://billing.stripe.com/portal/session/abc",
    });

    const req = new NextRequest("http://localhost/api/stripe/portal", {
      method: "POST",
    });
    const res = await portal(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://billing.stripe.com/portal/session/abc");

    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_portal_123",
        return_url: "http://localhost:3000/settings",
      })
    );
  });
});
