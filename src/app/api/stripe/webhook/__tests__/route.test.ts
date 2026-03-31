import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

// --- In-memory DB for realistic chaining ---
const db = {
  users: new Map<string, Record<string, unknown>>(),
  businesses: new Map<string, Record<string, unknown>>(),
  white_label_config: new Map<string, Record<string, unknown>>(),
  custom_domains: new Map<string, Record<string, unknown>>(),
};

function resetDb() {
  for (const table of Object.values(db)) table.clear();
  db.users.set("user-1", {
    id: "user-1",
    email: "owner@gym.com",
    plan_tier: "growth",
    subscription_status: "active",
    stripe_customer_id: "cus_123",
    stripe_subscription_id: "sub_old",
  });
  db.businesses.set("biz-1", {
    id: "biz-1",
    user_id: "user-1",
    name: "Downtown Gym",
  });
  db.white_label_config.set("wl-1", {
    id: "wl-1",
    business_id: "biz-1",
    hide_captivly_branding: false,
    custom_domain: null,
    custom_domain_verified: false,
  });
  db.custom_domains.set("cd-1", {
    id: "cd-1",
    business_id: "biz-1",
    verified: false,
    ssl_provisioned: false,
  });
}

function getTableItems(table: string, filters: Record<string, unknown>) {
  const tableData = db[table as keyof typeof db];
  if (!tableData) return [];
  return Array.from(tableData.values()).filter((row) => {
    for (const [key, value] of Object.entries(filters)) {
      if ((row as Record<string, unknown>)[key] !== value) return false;
    }
    return true;
  });
}

function buildQuery(table: string) {
  const filters: Record<string, unknown> = {};
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: (field: string, value: unknown) => {
      filters[field] = value;
      return chain;
    },
    single: () => {
      const items = getTableItems(table, filters);
      const item = items[0] ? { ...items[0] } : null;
      return Promise.resolve({ data: item, error: null });
    },
    update: (updates: Record<string, unknown>) => ({
      eq: (field: string, value: unknown) => {
        const tableData = db[table as keyof typeof db];
        if (tableData) {
          for (const [, record] of tableData) {
            if ((record as Record<string, unknown>)[field] === value) {
              Object.assign(record, updates);
            }
          }
        }
        return Promise.resolve({ error: null });
      },
    }),
  };
  return chain;
}

const mockFrom = vi.fn((table: string) => buildQuery(table));

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// --- Stripe mock ---
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
    resetDb();
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Signature validation
  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
  // checkout.session.completed
  // -----------------------------------------------------------------------
  describe("checkout.session.completed", () => {
    it("updates user plan, subscription_id, and stores stripe_customer_id", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            subscription: "sub_123",
            customer: "cus_new_456",
            metadata: { supabase_user_id: "user-1" },
          },
        },
      });

      mockSubscriptionsRetrieve.mockResolvedValue({
        id: "sub_123",
        customer: "cus_new_456",
        metadata: { supabase_user_id: "user-1" },
        items: { data: [{ price: { id: "price_growth" } }] },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const user = db.users.get("user-1");
      expect(user?.stripe_subscription_id).toBe("sub_123");
      expect(user?.stripe_customer_id).toBe("cus_new_456");
      expect(user?.plan_tier).toBe("growth");
      expect(user?.subscription_status).toBe("active");
    });

    it("falls back to session metadata when subscription metadata missing", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            subscription: "sub_789",
            customer: "cus_789",
            metadata: { supabase_user_id: "user-1" },
          },
        },
      });

      mockSubscriptionsRetrieve.mockResolvedValue({
        id: "sub_789",
        customer: "cus_789",
        metadata: {},
        items: { data: [{ price: { id: "price_pro" } }] },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const user = db.users.get("user-1");
      expect(user?.plan_tier).toBe("pro");
    });

    it("skips when session has no subscription (one-time payment)", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            subscription: null,
            metadata: { supabase_user_id: "user-1" },
          },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      // Plan should remain unchanged
      const user = db.users.get("user-1");
      expect(user?.plan_tier).toBe("growth");
    });

    it("defaults unknown price to starter", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            subscription: "sub_unknown",
            customer: "cus_123",
            metadata: { supabase_user_id: "user-1" },
          },
        },
      });

      mockSubscriptionsRetrieve.mockResolvedValue({
        id: "sub_unknown",
        customer: "cus_123",
        metadata: { supabase_user_id: "user-1" },
        items: { data: [{ price: { id: "price_unknown_plan" } }] },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const user = db.users.get("user-1");
      expect(user?.plan_tier).toBe("starter");
    });
  });

  // -----------------------------------------------------------------------
  // customer.subscription.updated
  // -----------------------------------------------------------------------
  describe("customer.subscription.updated", () => {
    it("updates plan and status on upgrade (growth → pro)", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
            status: "active",
            items: { data: [{ price: { id: "price_pro" } }] },
          },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const user = db.users.get("user-1");
      expect(user?.plan_tier).toBe("pro");
      expect(user?.subscription_status).toBe("active");
    });

    it("maps past_due Stripe status correctly", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
            status: "past_due",
            items: { data: [{ price: { id: "price_growth" } }] },
          },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const user = db.users.get("user-1");
      expect(user?.subscription_status).toBe("past_due");
    });

    it("maps unpaid Stripe status to past_due", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
            status: "unpaid",
            items: { data: [{ price: { id: "price_growth" } }] },
          },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const user = db.users.get("user-1");
      expect(user?.subscription_status).toBe("past_due");
    });

    it("maps trialing Stripe status to active", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
            status: "trialing",
            items: { data: [{ price: { id: "price_growth" } }] },
          },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const user = db.users.get("user-1");
      expect(user?.subscription_status).toBe("active");
    });

    it("maps incomplete_expired Stripe status to canceled", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
            status: "incomplete_expired",
            items: { data: [{ price: { id: "price_growth" } }] },
          },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const user = db.users.get("user-1");
      expect(user?.subscription_status).toBe("canceled");
    });

    it("maps truly unknown Stripe status to inactive", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
            status: "some_future_status",
            items: { data: [{ price: { id: "price_growth" } }] },
          },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const user = db.users.get("user-1");
      expect(user?.subscription_status).toBe("inactive");
    });

    it("deactivates Phase 4 features when downgrading from Pro", async () => {
      // Set user to Pro with active white-label
      const user = db.users.get("user-1");
      if (user) user.plan_tier = "pro";

      const wl = db.white_label_config.get("wl-1");
      if (wl) {
        wl.hide_captivly_branding = true;
        wl.custom_domain = "gym.example.com";
        wl.custom_domain_verified = true;
      }
      const cd = db.custom_domains.get("cd-1");
      if (cd) {
        cd.verified = true;
        cd.ssl_provisioned = true;
      }

      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
            status: "active",
            items: { data: [{ price: { id: "price_growth" } }] },
          },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      // User should be on growth now
      const updatedUser = db.users.get("user-1");
      expect(updatedUser?.plan_tier).toBe("growth");

      // White-label should be deactivated
      const updatedWl = db.white_label_config.get("wl-1");
      expect(updatedWl?.hide_captivly_branding).toBe(false);
      expect(updatedWl?.custom_domain).toBeNull();
      expect(updatedWl?.custom_domain_verified).toBe(false);

      // Custom domains should be unverified
      const updatedCd = db.custom_domains.get("cd-1");
      expect(updatedCd?.verified).toBe(false);
      expect(updatedCd?.ssl_provisioned).toBe(false);
    });

    it("does NOT deactivate Phase 4 features when staying on Pro", async () => {
      const user = db.users.get("user-1");
      if (user) user.plan_tier = "pro";

      const wl = db.white_label_config.get("wl-1");
      if (wl) {
        wl.hide_captivly_branding = true;
        wl.custom_domain = "gym.example.com";
      }

      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
            status: "active",
            items: { data: [{ price: { id: "price_pro" } }] },
          },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      // White-label should remain active
      const updatedWl = db.white_label_config.get("wl-1");
      expect(updatedWl?.hide_captivly_branding).toBe(true);
      expect(updatedWl?.custom_domain).toBe("gym.example.com");
    });

    it("skips when no user_id in metadata", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: {},
            status: "active",
            items: { data: [{ price: { id: "price_pro" } }] },
          },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      // User should remain unchanged
      const user = db.users.get("user-1");
      expect(user?.plan_tier).toBe("growth");
    });
  });

  // -----------------------------------------------------------------------
  // customer.subscription.deleted
  // -----------------------------------------------------------------------
  describe("customer.subscription.deleted", () => {
    it("downgrades to starter and clears subscription_id", async () => {
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

      const user = db.users.get("user-1");
      expect(user?.plan_tier).toBe("starter");
      expect(user?.subscription_status).toBe("canceled");
      expect(user?.stripe_subscription_id).toBeNull();
    });

    it("deactivates Phase 4 features when cancelling from Pro", async () => {
      const user = db.users.get("user-1");
      if (user) user.plan_tier = "pro";

      const wl = db.white_label_config.get("wl-1");
      if (wl) {
        wl.hide_captivly_branding = true;
        wl.custom_domain = "gym.example.com";
        wl.custom_domain_verified = true;
      }
      const cd = db.custom_domains.get("cd-1");
      if (cd) {
        cd.verified = true;
        cd.ssl_provisioned = true;
      }

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

      const updatedWl = db.white_label_config.get("wl-1");
      expect(updatedWl?.hide_captivly_branding).toBe(false);
      expect(updatedWl?.custom_domain).toBeNull();

      const updatedCd = db.custom_domains.get("cd-1");
      expect(updatedCd?.verified).toBe(false);
      expect(updatedCd?.ssl_provisioned).toBe(false);
    });

    it("does NOT deactivate Phase 4 features when cancelling from non-Pro", async () => {
      // User is on growth (default from resetDb)
      const wl = db.white_label_config.get("wl-1");
      if (wl) wl.hide_captivly_branding = false;

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

      // White-label should not have been touched (stays the same)
      const updatedWl = db.white_label_config.get("wl-1");
      expect(updatedWl?.hide_captivly_branding).toBe(false);
    });

    it("skips when no user_id in metadata", async () => {
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.deleted",
        data: {
          object: {
            metadata: {},
          },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      // User should remain unchanged
      const user = db.users.get("user-1");
      expect(user?.plan_tier).toBe("growth");
      expect(user?.subscription_status).toBe("active");
    });
  });

  // -----------------------------------------------------------------------
  // invoice.payment_failed
  // -----------------------------------------------------------------------
  describe("invoice.payment_failed", () => {
    it("marks user as past_due", async () => {
      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_failed",
        data: {
          object: { customer: "cus_123" },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const user = db.users.get("user-1");
      expect(user?.subscription_status).toBe("past_due");
      // Plan should remain unchanged
      expect(user?.plan_tier).toBe("growth");
    });

    it("handles unknown customer gracefully", async () => {
      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_failed",
        data: {
          object: { customer: "cus_unknown" },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      // User should remain unchanged
      const user = db.users.get("user-1");
      expect(user?.subscription_status).toBe("active");
    });
  });

  // -----------------------------------------------------------------------
  // invoice.payment_succeeded
  // -----------------------------------------------------------------------
  describe("invoice.payment_succeeded", () => {
    it("restores active status when user was past_due", async () => {
      const user = db.users.get("user-1");
      if (user) user.subscription_status = "past_due";

      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_succeeded",
        data: {
          object: { customer: "cus_123" },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const updatedUser = db.users.get("user-1");
      expect(updatedUser?.subscription_status).toBe("active");
    });

    it("does not change status when already active", async () => {
      // User is already active (default)
      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_succeeded",
        data: {
          object: { customer: "cus_123" },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      const user = db.users.get("user-1");
      expect(user?.subscription_status).toBe("active");
    });

    it("handles unknown customer gracefully", async () => {
      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_succeeded",
        data: {
          object: { customer: "cus_not_found" },
        },
      });

      const res = await POST(createRequest("{}", "valid_sig"));
      expect(res.status).toBe(200);

      // Should not throw
      const user = db.users.get("user-1");
      expect(user?.subscription_status).toBe("active");
    });
  });

  // -----------------------------------------------------------------------
  // Unknown event types
  // -----------------------------------------------------------------------
  it("returns 200 for unhandled event types", async () => {
    mockConstructEvent.mockReturnValue({
      type: "charge.refunded",
      data: { object: {} },
    });

    const res = await POST(createRequest("{}", "valid_sig"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });
});
