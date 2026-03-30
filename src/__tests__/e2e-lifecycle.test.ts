/**
 * End-to-end lifecycle tests for Stripe subscription flows
 * and their integration with feature gating.
 *
 * These tests verify the connected journey:
 *   1. Checkout → user activated with correct plan
 *   2. Upgrade/downgrade → plan changes, Phase 4 features toggled
 *   3. Payment failure → past_due status
 *   4. Payment recovery → active status restored
 *   5. Cancellation → starter fallback, Phase 4 cleanup
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { stubTestEnv } from "./setup-env";

stubTestEnv();

// ---------------------------------------------------------------------------
// In-memory DB
// ---------------------------------------------------------------------------
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
    plan_tier: "starter",
    subscription_status: "inactive",
    stripe_customer_id: null,
    stripe_subscription_id: null,
  });

  db.businesses.set("biz-1", {
    id: "biz-1",
    user_id: "user-1",
    name: "Downtown Gym",
    type: "gym",
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
    domain: "gym.example.com",
    verified: false,
    ssl_provisioned: false,
  });
}

// ---------------------------------------------------------------------------
// Supabase mock with in-memory DB
// ---------------------------------------------------------------------------
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

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({ from: (table: string) => buildQuery(table) })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Stripe mock
// ---------------------------------------------------------------------------
const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockSubscriptionsRetrieve },
  }),
  STRIPE_PRICES: {
    starter: "price_starter",
    growth: "price_growth",
    pro: "price_pro",
  },
}));

// ---------------------------------------------------------------------------
// Import route handler
// ---------------------------------------------------------------------------
import { POST as stripeWebhook } from "@/app/api/stripe/webhook/route";

function webhookRequest(body = "{}") {
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
    headers: { "stripe-signature": "valid_sig" },
  });
}

function fireEvent(event: Record<string, unknown>) {
  mockConstructEvent.mockReturnValue(event);
  return stripeWebhook(webhookRequest());
}

// ===========================================================================
// LIFECYCLE TESTS
// ===========================================================================

describe("E2E: Stripe Subscription Lifecycle", () => {
  beforeEach(() => {
    resetDb();
    vi.clearAllMocks();
  });

  describe("Full lifecycle: checkout → upgrade → payment failure → recovery → cancel", () => {
    it("walks through the complete subscription journey", async () => {
      const getUser = () => db.users.get("user-1")!;

      // --- Step 1: Checkout completed (starter plan) ---
      mockSubscriptionsRetrieve.mockResolvedValue({
        id: "sub_001",
        customer: "cus_001",
        metadata: { supabase_user_id: "user-1" },
        items: { data: [{ price: { id: "price_starter" } }] },
      });

      let res = await fireEvent({
        type: "checkout.session.completed",
        data: {
          object: {
            subscription: "sub_001",
            customer: "cus_001",
            metadata: { supabase_user_id: "user-1" },
          },
        },
      });
      expect(res.status).toBe(200);

      expect(getUser().plan_tier).toBe("starter");
      expect(getUser().subscription_status).toBe("active");
      expect(getUser().stripe_customer_id).toBe("cus_001");
      expect(getUser().stripe_subscription_id).toBe("sub_001");

      // --- Step 2: Upgrade to growth ---
      res = await fireEvent({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
            status: "active",
            items: { data: [{ price: { id: "price_growth" } }] },
          },
        },
      });
      expect(res.status).toBe(200);

      expect(getUser().plan_tier).toBe("growth");
      expect(getUser().subscription_status).toBe("active");

      // --- Step 3: Upgrade to pro ---
      res = await fireEvent({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
            status: "active",
            items: { data: [{ price: { id: "price_pro" } }] },
          },
        },
      });
      expect(res.status).toBe(200);

      expect(getUser().plan_tier).toBe("pro");

      // --- Step 4: Enable white-label features (simulating user action) ---
      const wl = db.white_label_config.get("wl-1")!;
      wl.hide_captivly_branding = true;
      wl.custom_domain = "gym.example.com";
      wl.custom_domain_verified = true;
      const cd = db.custom_domains.get("cd-1")!;
      cd.verified = true;
      cd.ssl_provisioned = true;

      // --- Step 5: Payment fails ---
      res = await fireEvent({
        type: "invoice.payment_failed",
        data: {
          object: { customer: "cus_001" },
        },
      });
      expect(res.status).toBe(200);

      expect(getUser().subscription_status).toBe("past_due");
      expect(getUser().plan_tier).toBe("pro"); // Plan doesn't change on payment failure

      // --- Step 6: Payment recovered ---
      res = await fireEvent({
        type: "invoice.payment_succeeded",
        data: {
          object: { customer: "cus_001" },
        },
      });
      expect(res.status).toBe(200);

      expect(getUser().subscription_status).toBe("active");
      expect(getUser().plan_tier).toBe("pro");

      // --- Step 7: Downgrade from Pro to Growth ---
      res = await fireEvent({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
            status: "active",
            items: { data: [{ price: { id: "price_growth" } }] },
          },
        },
      });
      expect(res.status).toBe(200);

      expect(getUser().plan_tier).toBe("growth");

      // Phase 4 features should be deactivated
      const updatedWl = db.white_label_config.get("wl-1")!;
      expect(updatedWl.hide_captivly_branding).toBe(false);
      expect(updatedWl.custom_domain).toBeNull();
      expect(updatedWl.custom_domain_verified).toBe(false);

      const updatedCd = db.custom_domains.get("cd-1")!;
      expect(updatedCd.verified).toBe(false);
      expect(updatedCd.ssl_provisioned).toBe(false);

      // --- Step 8: Cancel subscription ---
      res = await fireEvent({
        type: "customer.subscription.deleted",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
          },
        },
      });
      expect(res.status).toBe(200);

      expect(getUser().plan_tier).toBe("starter");
      expect(getUser().subscription_status).toBe("canceled");
      expect(getUser().stripe_subscription_id).toBeNull();
    });
  });

  describe("Pro cancellation deactivates Phase 4 features", () => {
    it("resets white-label and custom domains when cancelled from Pro", async () => {
      // Setup: user on Pro with active white-label
      const user = db.users.get("user-1")!;
      user.plan_tier = "pro";
      user.subscription_status = "active";
      user.stripe_customer_id = "cus_001";
      user.stripe_subscription_id = "sub_001";

      const wl = db.white_label_config.get("wl-1")!;
      wl.hide_captivly_branding = true;
      wl.custom_domain = "gym.example.com";
      wl.custom_domain_verified = true;

      const cd = db.custom_domains.get("cd-1")!;
      cd.verified = true;
      cd.ssl_provisioned = true;

      const res = await fireEvent({
        type: "customer.subscription.deleted",
        data: {
          object: {
            metadata: { supabase_user_id: "user-1" },
          },
        },
      });
      expect(res.status).toBe(200);

      // User falls back to starter
      expect(user.plan_tier).toBe("starter");
      expect(user.subscription_status).toBe("canceled");

      // Phase 4 features deactivated
      expect(wl.hide_captivly_branding).toBe(false);
      expect(wl.custom_domain).toBeNull();
      expect(cd.verified).toBe(false);
      expect(cd.ssl_provisioned).toBe(false);
    });
  });

  describe("Payment failure and recovery", () => {
    it("marks past_due on failure and restores active on recovery", async () => {
      const user = db.users.get("user-1")!;
      user.plan_tier = "growth";
      user.subscription_status = "active";
      user.stripe_customer_id = "cus_001";

      // Payment fails
      let res = await fireEvent({
        type: "invoice.payment_failed",
        data: { object: { customer: "cus_001" } },
      });
      expect(res.status).toBe(200);
      expect(user.subscription_status).toBe("past_due");
      expect(user.plan_tier).toBe("growth"); // Plan unchanged

      // Payment succeeds
      res = await fireEvent({
        type: "invoice.payment_succeeded",
        data: { object: { customer: "cus_001" } },
      });
      expect(res.status).toBe(200);
      expect(user.subscription_status).toBe("active");
    });

    it("does not change active status on payment_succeeded if already active", async () => {
      const user = db.users.get("user-1")!;
      user.plan_tier = "growth";
      user.subscription_status = "active";
      user.stripe_customer_id = "cus_001";

      const res = await fireEvent({
        type: "invoice.payment_succeeded",
        data: { object: { customer: "cus_001" } },
      });
      expect(res.status).toBe(200);
      expect(user.subscription_status).toBe("active");
    });
  });

  describe("Checkout stores stripe_customer_id", () => {
    it("stores customer_id so future invoice events can find the user", async () => {
      const user = db.users.get("user-1")!;
      expect(user.stripe_customer_id).toBeNull();

      mockSubscriptionsRetrieve.mockResolvedValue({
        id: "sub_new",
        customer: "cus_brand_new",
        metadata: { supabase_user_id: "user-1" },
        items: { data: [{ price: { id: "price_growth" } }] },
      });

      await fireEvent({
        type: "checkout.session.completed",
        data: {
          object: {
            subscription: "sub_new",
            customer: "cus_brand_new",
            metadata: { supabase_user_id: "user-1" },
          },
        },
      });

      expect(user.stripe_customer_id).toBe("cus_brand_new");

      // Now invoice.payment_failed can find this user
      const res = await fireEvent({
        type: "invoice.payment_failed",
        data: { object: { customer: "cus_brand_new" } },
      });
      expect(res.status).toBe(200);
      expect(user.subscription_status).toBe("past_due");
    });
  });

  describe("Edge cases", () => {
    it("handles subscription.updated with missing user_id gracefully", async () => {
      const res = await fireEvent({
        type: "customer.subscription.updated",
        data: {
          object: {
            metadata: {},
            status: "active",
            items: { data: [{ price: { id: "price_pro" } }] },
          },
        },
      });
      expect(res.status).toBe(200);

      // User unchanged
      expect(db.users.get("user-1")!.plan_tier).toBe("starter");
    });

    it("handles subscription.deleted with missing user_id gracefully", async () => {
      const user = db.users.get("user-1")!;
      user.plan_tier = "growth";

      const res = await fireEvent({
        type: "customer.subscription.deleted",
        data: {
          object: { metadata: {} },
        },
      });
      expect(res.status).toBe(200);

      // User unchanged
      expect(user.plan_tier).toBe("growth");
    });

    it("handles unknown event types without error", async () => {
      const res = await fireEvent({
        type: "charge.refunded",
        data: { object: {} },
      });
      expect(res.status).toBe(200);
    });

    it("maps all Stripe subscription statuses correctly via subscription.updated", async () => {
      const user = db.users.get("user-1")!;
      user.plan_tier = "growth";
      user.subscription_status = "active";

      const statusTests = [
        { stripeStatus: "active", expected: "active" },
        { stripeStatus: "past_due", expected: "past_due" },
        { stripeStatus: "canceled", expected: "canceled" },
        { stripeStatus: "unpaid", expected: "past_due" },
        { stripeStatus: "trialing", expected: "active" },
        { stripeStatus: "incomplete_expired", expected: "inactive" },
      ];

      for (const { stripeStatus, expected } of statusTests) {
        await fireEvent({
          type: "customer.subscription.updated",
          data: {
            object: {
              metadata: { supabase_user_id: "user-1" },
              status: stripeStatus,
              items: { data: [{ price: { id: "price_growth" } }] },
            },
          },
        });

        expect(user.subscription_status).toBe(expected);
      }
    });
  });
});
