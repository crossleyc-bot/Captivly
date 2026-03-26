/**
 * End-to-end smoke tests for the full Captivly.ai lead lifecycle.
 *
 * These tests simulate the complete data flow through the system:
 *   1. Meta webhook ingests a lead
 *   2. AI scores the lead
 *   3. Sequence generation creates outreach steps
 *   4. Scheduler queues messages for the lead
 *   5. Sender fires email/SMS
 *
 * All external services (Meta API, Anthropic, Resend, Twilio, Supabase)
 * are mocked at the boundary. The tests verify that data flows correctly
 * between route handlers and that business rules are enforced.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { stubTestEnv } from "./setup-env";

// Environment variables (must be before any imports that read them)
stubTestEnv();

// ---------------------------------------------------------------------------
// Shared mock state — simulates the database across route handlers
// ---------------------------------------------------------------------------
const db = {
  users: new Map<string, Record<string, unknown>>(),
  businesses: new Map<string, Record<string, unknown>>(),
  campaigns: new Map<string, Record<string, unknown>>(),
  leads: new Map<string, Record<string, unknown>>(),
  sequences: new Map<string, Record<string, unknown>>(),
  sequence_steps: new Map<string, Record<string, unknown>>(),
  messages_sent: new Map<string, Record<string, unknown>>(),
  usage_tracking: new Map<string, Record<string, unknown>>(),
  conversions: new Map<string, Record<string, unknown>>(),
};

function resetDb() {
  for (const table of Object.values(db)) table.clear();

  // Seed a test user
  db.users.set("user-1", {
    id: "user-1",
    email: "owner@gym.com",
    full_name: "Gym Owner",
    plan_tier: "growth",
    subscription_status: "active",
    stripe_customer_id: "cus_test",
  });

  // Seed a business
  db.businesses.set("biz-1", {
    id: "biz-1",
    user_id: "user-1",
    name: "Downtown Gym",
    type: "gym",
    location_city: "Austin",
    location_state: "TX",
    target_age_min: 18,
    target_age_max: 55,
    target_interests: ["fitness", "health"],
    primary_offer: "Free 7-day trial membership",
    outreach_tone: "friendly",
    meta_ad_account_id: "act_123",
    meta_page_id: "page-1",
    meta_access_token: "meta-token-abc",
    onboarding_completed: true,
  });

  // Seed a campaign
  db.campaigns.set("camp-1", {
    id: "camp-1",
    business_id: "biz-1",
    name: "Summer Promo",
    meta_campaign_id: "mc-1",
    meta_form_id: "form-1",
    status: "active",
    leads_count: 0,
    conversions_count: 0,
    daily_budget_cents: 2000,
  });

  // Seed usage tracking (month start)
  db.usage_tracking.set("biz-1:2026-03", {
    business_id: "biz-1",
    month: "2026-03",
    leads_count: 5,
    sms_count: 10,
    emails_count: 20,
  });
}

// ---------------------------------------------------------------------------
// Supabase mock — routes queries to in-memory DB
// ---------------------------------------------------------------------------
function createMockSupabaseClient() {
  const mockRpc = vi.fn().mockImplementation((fn: string, params: Record<string, unknown>) => {
    if (fn === "increment_usage") {
      const key = `${params.p_business_id}:${params.p_month}`;
      const usage = db.usage_tracking.get(key);
      if (usage) {
        const field = params.p_field as string;
        (usage as Record<string, number>)[field] = ((usage as Record<string, number>)[field] ?? 0) + 1;
      }
    }
    if (fn === "increment_campaign_leads") {
      const camp = db.campaigns.get(params.p_campaign_id as string);
      if (camp) (camp as Record<string, number>).leads_count += 1;
    }
    return Promise.resolve({});
  });

  function buildQuery(table: string) {
    const filters: Record<string, unknown> = {};
    let limitNum = 1000;

    // Make the chain "thenable" — when awaited without .single(),
    // resolves to { data: items, count: items.length }
    function resolve() {
      const items = getTableItems(table, filters).slice(0, limitNum);
      return { data: items, count: items.length, error: null };
    }

    const chain: Record<string, unknown> = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      select: (_fields: string, _opts?: { count?: string; head?: boolean }) => {
        return chain;
      },
      eq: (field: string, value: unknown) => {
        filters[field] = value;
        return chain;
      },
      in: (field: string, values: unknown[]) => {
        filters[`${field}__in`] = values;
        return chain;
      },
      lte: (field: string, value: unknown) => {
        filters[`${field}__lte`] = value;
        return chain;
      },
      order: () => chain,
      limit: (n: number) => {
        limitNum = n;
        return chain;
      },
      // When awaited directly (no .single()), resolve with data array + count
      then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) => {
        return Promise.resolve(resolve()).then(onFulfilled, onRejected);
      },
      single: () => {
        const items = getTableItems(table, filters);
        const item = items[0] ?? null;
        return Promise.resolve({ data: item, error: null });
      },
      maybeSingle: () => {
        const items = getTableItems(table, filters);
        const item = items[0] ?? null;
        return Promise.resolve({ data: item, error: null });
      },
      insert: (row: Record<string, unknown> | Record<string, unknown>[]) => {
        const rows = Array.isArray(row) ? row : [row];
        for (const r of rows) {
          const id = (r.id as string) ?? `${table}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const record = { ...r, id, created_at: new Date().toISOString() };
          db[table as keyof typeof db]?.set(id, record);
        }
        const lastId = Array.from(db[table as keyof typeof db]?.keys() ?? []).pop();
        return {
          select: () => ({
            single: () =>
              Promise.resolve({
                data: lastId ? db[table as keyof typeof db]?.get(lastId) : null,
                error: null,
              }),
          }),
        };
      },
      upsert: (row: Record<string, unknown> | Record<string, unknown>[], _opts?: Record<string, unknown>) => {
        const rows = Array.isArray(row) ? row : [row];
        for (const r of rows) {
          const id = (r.id as string) ?? `${table}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const record = { ...r, id, created_at: new Date().toISOString() };
          db[table as keyof typeof db]?.set(id, record);
        }
        const lastId = Array.from(db[table as keyof typeof db]?.keys() ?? []).pop();
        return {
          select: () => ({
            single: () =>
              Promise.resolve({
                data: lastId ? db[table as keyof typeof db]?.get(lastId) : null,
                error: null,
              }),
          }),
        };
      },
      update: (updates: Record<string, unknown>) => ({
        eq: (field: string, value: unknown) => {
          for (const [, record] of db[table as keyof typeof db] ?? []) {
            if ((record as Record<string, unknown>)[field] === value) {
              Object.assign(record, updates);
            }
          }
          return Promise.resolve({ error: null });
        },
      }),
    };

    return chain;
  }

  function getTableItems(table: string, filters: Record<string, unknown>) {
    const tableData = db[table as keyof typeof db];
    if (!tableData) return [];

    return Array.from(tableData.values()).filter((row) => {
      for (const [key, value] of Object.entries(filters)) {
        if (key.endsWith("__in")) {
          const field = key.replace("__in", "");
          if (!(value as unknown[]).includes((row as Record<string, unknown>)[field])) return false;
        } else if (key.endsWith("__lte")) {
          // skip lte filter for simplicity in smoke tests
        } else {
          if ((row as Record<string, unknown>)[key] !== value) return false;
        }
      }
      return true;
    });
  }

  return {
    from: (table: string) => buildQuery(table),
    rpc: mockRpc,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "owner@gym.com" } },
      }),
    },
  };
}

const mockSupabase = createMockSupabaseClient();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => mockSupabase),
}));

// ---------------------------------------------------------------------------
// Anthropic mock
// ---------------------------------------------------------------------------
vi.mock("@/lib/anthropic", () => ({
  getAnthropicClient: () => ({
    messages: {
      create: vi.fn().mockImplementation(({ system }: { system: string }) => {
        // Return appropriate mock based on whether it's scoring or sequence gen
        if (system.includes("lead quality analyst")) {
          return Promise.resolve({
            content: [{ type: "text", text: '{"score": 8, "reason": "Great match — fitness enthusiast in target area"}' }],
          });
        }
        // Sequence generation
        return Promise.resolve({
          content: [{
            type: "text",
            text: JSON.stringify([
              { step: 1, channel: "email", subject: "Welcome to Downtown Gym!", body: "Hi! Thanks for your interest in our free trial.", delay_days: 0 },
              { step: 2, channel: "sms", body: "Hey! Ready to start your free trial? Reply YES to book.", delay_days: 2 },
              { step: 3, channel: "email", subject: "Your trial is waiting", body: "Don't miss out on your free 7-day trial membership.", delay_days: 5 },
              { step: 4, channel: "sms", body: "Last chance! Your free trial offer expires soon.", delay_days: 8 },
              { step: 5, channel: "email", subject: "One more thing...", body: "We'd love to have you. Come visit us this week!", delay_days: 12 },
            ]),
          }],
        });
      }),
    },
  }),
  AI_MODEL: "claude-sonnet-4-20250514",
}));

// ---------------------------------------------------------------------------
// Resend mock
// ---------------------------------------------------------------------------
const mockResendSend = vi.fn().mockResolvedValue({ data: { id: "resend-msg-1" }, error: null });
vi.mock("@/lib/resend", () => ({
  getResendClient: () => ({ emails: { send: mockResendSend } }),
}));

// ---------------------------------------------------------------------------
// Twilio mock
// ---------------------------------------------------------------------------
const mockTwilioCreate = vi.fn().mockResolvedValue({ sid: "twilio-sid-1", errorCode: null });
vi.mock("@/lib/twilio", () => ({
  getTwilioClient: () => ({ messages: { create: mockTwilioCreate } }),
  TWILIO_FROM: "+15555555555",
}));

// ---------------------------------------------------------------------------
// Stripe mock
// ---------------------------------------------------------------------------
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    customers: { create: vi.fn().mockResolvedValue({ id: "cus_new" }) },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
      },
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        metadata: { supabase_user_id: "user-1" },
        items: { data: [{ price: { id: "price_growth" } }] },
      }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  }),
  STRIPE_PRICES: {
    starter: "price_starter",
    growth: "price_growth",
    pro: "price_pro",
  },
}));

// ---------------------------------------------------------------------------
// Global fetch mock (for internal API calls from webhook → score)
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function internalHeaders(extra: Record<string, string> = {}) {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer test-internal-secret",
    ...extra,
  };
}

function makeRequest(url: string, body: unknown, headers?: Record<string, string>) {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: headers ?? { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Import route handlers (after all mocks are set up)
// ---------------------------------------------------------------------------
import { GET as webhookGET, POST as webhookPOST } from "@/app/api/meta/webhook/route";
import { POST as scorePOST } from "@/app/api/leads/score/route";
import { POST as generatePOST } from "@/app/api/sequences/generate/route";
import { POST as schedulerPOST } from "@/app/api/sequences/scheduler/route";
import { POST as sendPOST } from "@/app/api/sequences/send/route";
import { POST as checkoutPOST } from "@/app/api/stripe/create-checkout/route";

// ===========================================================================
// SMOKE TESTS
// ===========================================================================

describe("Smoke Tests: Full Lead Lifecycle", () => {
  beforeAll(() => {
    resetDb();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Meta API calls for webhook
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("graph.facebook.com")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              field_data: [
                { name: "full_name", values: ["Sarah Johnson"] },
                { name: "email", values: ["sarah@example.com"] },
                { name: "phone_number", values: ["+15551234567"] },
              ],
            }),
        });
      }
      // Internal scoring call from webhook
      if (typeof url === "string" && url.includes("/api/leads/score")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      // Internal send call from scheduler
      if (typeof url === "string" && url.includes("/api/sequences/send")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ sent: true }) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Unknown URL" }) });
    });
  });

  // -------------------------------------------------------------------------
  // 1. Webhook verification
  // -------------------------------------------------------------------------
  describe("Step 1: Meta Webhook Verification", () => {
    it("accepts valid verify token and returns challenge", async () => {
      const url = new URL("http://localhost/api/meta/webhook");
      url.searchParams.set("hub.mode", "subscribe");
      url.searchParams.set("hub.verify_token", "captivly_webhook_secret");
      url.searchParams.set("hub.challenge", "challenge_abc");

      const res = await webhookGET(new NextRequest(url));
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("challenge_abc");
    });

    it("rejects invalid verify token", async () => {
      const url = new URL("http://localhost/api/meta/webhook");
      url.searchParams.set("hub.mode", "subscribe");
      url.searchParams.set("hub.verify_token", "bad_token");
      url.searchParams.set("hub.challenge", "challenge_abc");

      const res = await webhookGET(new NextRequest(url));
      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Lead ingestion via webhook
  // -------------------------------------------------------------------------
  describe("Step 2: Lead Ingestion via Meta Webhook", () => {
    it("ingests a lead from Meta and stores it in the database", async () => {
      const body = {
        object: "page",
        entry: [{
          changes: [{
            field: "leadgen",
            value: {
              form_id: "form-1",
              leadgen_id: "meta-lead-100",
              page_id: "page-1",
              created_time: Date.now(),
            },
          }],
        }],
      };

      const req = makeRequest("/api/meta/webhook", body);
      const res = await webhookPOST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(true);

      // Verify lead was stored
      expect(db.leads.size).toBeGreaterThanOrEqual(1);
      const lead = Array.from(db.leads.values()).find(
        (l) => (l as Record<string, unknown>).meta_lead_id === "meta-lead-100"
      );
      expect(lead).toBeDefined();
    });

    it("skips non-page webhook events", async () => {
      const prevLeadCount = db.leads.size;
      const req = makeRequest("/api/meta/webhook", { object: "user", entry: [] });
      const res = await webhookPOST(req);
      expect(res.status).toBe(200);
      expect(db.leads.size).toBe(prevLeadCount);
    });

    it("deduplicates leads with the same meta_lead_id", async () => {
      const prevLeadCount = db.leads.size;
      const body = {
        object: "page",
        entry: [{
          changes: [{
            field: "leadgen",
            value: {
              form_id: "form-1",
              leadgen_id: "meta-lead-100", // Same as above
              page_id: "page-1",
              created_time: Date.now(),
            },
          }],
        }],
      };

      const req = makeRequest("/api/meta/webhook", body);
      await webhookPOST(req);

      // Should NOT have created a duplicate
      expect(db.leads.size).toBe(prevLeadCount);
    });
  });

  // -------------------------------------------------------------------------
  // 3. AI Lead Scoring
  // -------------------------------------------------------------------------
  describe("Step 3: AI Lead Scoring", () => {
    it("scores a lead and updates the database", async () => {
      const leadId = Array.from(db.leads.keys())[0];
      const req = makeRequest("/api/leads/score", { lead_id: leadId }, internalHeaders());

      const res = await scorePOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.score).toBe(8);
      expect(data.reason).toContain("fitness");

      // Verify lead was updated in DB
      const lead = db.leads.get(leadId) as Record<string, unknown>;
      expect(lead.ai_score).toBe(8);
    });

    it("rejects scoring without internal auth", async () => {
      const leadId = Array.from(db.leads.keys())[0];
      const req = makeRequest("/api/leads/score", { lead_id: leadId });

      const res = await scorePOST(req);
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Sequence Generation
  // -------------------------------------------------------------------------
  describe("Step 4: AI Sequence Generation", () => {
    it("generates a 5-step sequence for a growth plan campaign", async () => {
      const req = makeRequest("/api/sequences/generate", { campaign_id: "camp-1" });

      const res = await generatePOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.sequence_id).toBeDefined();
      expect(data.steps).toHaveLength(5);

      // Verify mix of email and SMS channels
      const channels = data.steps.map((s: { channel: string }) => s.channel);
      expect(channels).toContain("email");
      expect(channels).toContain("sms");

      // Verify sequence was stored
      expect(db.sequences.size).toBe(1);
      expect(db.sequence_steps.size).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Scheduler queues messages
  // -------------------------------------------------------------------------
  describe("Step 5: Sequence Scheduler", () => {
    it("queues messages for leads in active sequences", async () => {
      const req = makeRequest("/api/sequences/scheduler", {}, internalHeaders());
      const res = await schedulerPOST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.queued).toBeGreaterThan(0);

      // Verify messages were queued in DB
      expect(db.messages_sent.size).toBeGreaterThan(0);
      const firstMsg = Array.from(db.messages_sent.values())[0] as Record<string, unknown>;
      expect(firstMsg.status).toBe("queued");
    });

    it("rejects scheduler calls without internal auth", async () => {
      const req = makeRequest("/api/sequences/scheduler", {});
      const res = await schedulerPOST(req);
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Message sending (email)
  // -------------------------------------------------------------------------
  describe("Step 6: Message Sending", () => {
    it("sends an email message via Resend", async () => {
      // Insert a queued email message manually to test the send route directly
      const msgId = "msg-email-1";
      db.messages_sent.set(msgId, {
        id: msgId,
        lead_id: Array.from(db.leads.keys())[0],
        sequence_step_id: Array.from(db.sequence_steps.keys())[0],
        status: "queued",
        sent_at: new Date().toISOString(),
      });

      // The send route does a join query — mock its response via the from() chain
      // For this smoke test, we test the actual send route with a custom mock
      const leadId = Array.from(db.leads.keys())[0];
      const stepId = Array.from(db.sequence_steps.keys())[0];
      const lead = db.leads.get(leadId);
      const step = db.sequence_steps.get(stepId);

      // Patch the message to have related data inline (matching the join query format)
      db.messages_sent.set(msgId, {
        id: msgId,
        status: "queued",
        lead: { ...(lead as object), business_id: "biz-1" },
        step: { ...(step as object), channel: "email", subject: "Welcome!", body: "Hi Sarah!" },
      });

      const req = makeRequest("/api/sequences/send", { message_id: msgId }, internalHeaders());
      const res = await sendPOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.sent).toBe(true);
      expect(data.provider_message_id).toBe("resend-msg-1");

      // Verify Resend was called
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "sarah@example.com",
          subject: "Welcome!",
          html: expect.stringContaining("Hi Sarah!"),
        })
      );
    });

    it("sends an SMS message via Twilio", async () => {
      const msgId = "msg-sms-1";
      const leadId = Array.from(db.leads.keys())[0];
      const lead = db.leads.get(leadId);

      db.messages_sent.set(msgId, {
        id: msgId,
        status: "queued",
        lead: { ...(lead as object), business_id: "biz-1", status: "in_sequence" },
        step: { channel: "sms", subject: null, body: "Hey! Ready for your trial?" },
      });

      const req = makeRequest("/api/sequences/send", { message_id: msgId }, internalHeaders());
      const res = await sendPOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.sent).toBe(true);

      // Verify Twilio was called
      expect(mockTwilioCreate).toHaveBeenCalledWith({
        body: "Hey! Ready for your trial?",
        from: "+15555555555",
        to: "+15551234567",
      });
    });

    it("rejects send without internal auth", async () => {
      const req = makeRequest("/api/sequences/send", { message_id: "msg-email-1" });
      const res = await sendPOST(req);
      expect(res.status).toBe(401);
    });
  });
});

// ===========================================================================
// SMOKE TESTS: Feature Gating & Plan Limits
// ===========================================================================
describe("Smoke Tests: Feature Gating & Plan Limits", () => {
  beforeEach(() => {
    resetDb();
    vi.clearAllMocks();
  });

  it("blocks SMS when plan is starter (0 SMS limit)", async () => {
    // Downgrade user to starter
    const user = db.users.get("user-1");
    if (user) (user as Record<string, unknown>).plan_tier = "starter";

    const leadId = "lead-starter-1";
    db.leads.set(leadId, {
      id: leadId,
      business_id: "biz-1",
      email: null,
      phone: "+15551234567",
      first_name: "Test",
      status: "new",
    });

    const msgId = "msg-starter-sms";
    db.messages_sent.set(msgId, {
      id: msgId,
      status: "queued",
      lead: { id: leadId, business_id: "biz-1", email: null, phone: "+15551234567", status: "new" },
      step: { channel: "sms", subject: null, body: "Hi!" },
    });

    const req = makeRequest("/api/sequences/send", { message_id: msgId }, internalHeaders());
    const res = await sendPOST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("SMS limit");
  });

  it("creates Stripe checkout session for plan upgrade", async () => {
    const req = makeRequest("/api/stripe/create-checkout", { plan: "pro" });
    const res = await checkoutPOST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.url).toContain("checkout.stripe.com");
  });

  it("rejects invalid plan for checkout", async () => {
    const req = makeRequest("/api/stripe/create-checkout", { plan: "mega" });
    const res = await checkoutPOST(req);
    expect(res.status).toBe(400);
  });

  it("blocks lead ingestion when monthly limit reached", async () => {
    // Set usage to the growth plan limit (500)
    db.usage_tracking.set("biz-1:2026-03", {
      business_id: "biz-1",
      month: "2026-03",
      leads_count: 500,
      sms_count: 0,
      emails_count: 0,
    });

    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("graph.facebook.com")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              field_data: [
                { name: "email", values: ["overlimit@example.com"] },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const prevLeadCount = db.leads.size;
    const body = {
      object: "page",
      entry: [{
        changes: [{
          field: "leadgen",
          value: {
            form_id: "form-1",
            leadgen_id: "meta-lead-overlimit",
            page_id: "page-1",
            created_time: Date.now(),
          },
        }],
      }],
    };

    const req = makeRequest("/api/meta/webhook", body);
    await webhookPOST(req);

    // Lead should NOT have been created (over limit)
    expect(db.leads.size).toBe(prevLeadCount);
  });
});

// ===========================================================================
// SMOKE TESTS: Auth Protection
// ===========================================================================
describe("Smoke Tests: Auth Protection on Internal Routes", () => {
  it("rejects /api/leads/score without auth", async () => {
    const req = makeRequest("/api/leads/score", { lead_id: "any" });
    const res = await scorePOST(req);
    expect(res.status).toBe(401);
  });

  it("rejects /api/sequences/send without auth", async () => {
    const req = makeRequest("/api/sequences/send", { message_id: "any" });
    const res = await sendPOST(req);
    expect(res.status).toBe(401);
  });

  it("rejects /api/sequences/scheduler without auth", async () => {
    const req = makeRequest("/api/sequences/scheduler", {});
    const res = await schedulerPOST(req);
    expect(res.status).toBe(401);
  });

  it("rejects auth with wrong secret", async () => {
    const req = makeRequest("/api/leads/score", { lead_id: "any" }, {
      "Content-Type": "application/json",
      Authorization: "Bearer wrong-secret-here",
    });
    const res = await scorePOST(req);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// SMOKE TESTS: Sequence Generation Constraints
// ===========================================================================
describe("Smoke Tests: Sequence Generation Respects Plan", () => {
  beforeEach(() => {
    resetDb();
    vi.clearAllMocks();
  });

  it("generates only 3 steps for starter plan (email only)", async () => {
    // Downgrade to starter
    const user = db.users.get("user-1");
    if (user) (user as Record<string, unknown>).plan_tier = "starter";

    const req = makeRequest("/api/sequences/generate", { campaign_id: "camp-1" });
    const res = await generatePOST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    // AI returns 5 steps, but starter plan enforces max 3
    expect(data.steps.length).toBeLessThanOrEqual(3);

    // Starter has 0 SMS — all SMS should be converted to email
    for (const step of data.steps) {
      expect(step.channel).toBe("email");
    }
  });

  it("requires authentication for sequence generation", async () => {
    // Mock auth to return no user
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
    });

    const req = makeRequest("/api/sequences/generate", { campaign_id: "camp-1" });
    const res = await generatePOST(req);
    expect(res.status).toBe(401);
  });
});
