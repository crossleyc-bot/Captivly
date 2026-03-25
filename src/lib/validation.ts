import { z } from "zod";
import { NextRequest } from "next/server";
import { badRequest } from "@/lib/error-handler";

/**
 * Parses and validates a JSON request body against a Zod schema.
 * Returns the parsed data or a standardized 400 error response.
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; error: ReturnType<typeof badRequest> }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { success: false, error: badRequest("Invalid JSON body") };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    const path = firstError?.path.join(".") || "body";
    const message = firstError?.message || "Validation failed";
    return {
      success: false,
      error: badRequest(`${path}: ${message}`),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validates query parameters against a Zod schema.
 */
export function validateQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: ReturnType<typeof badRequest> } {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);
  if (!result.success) {
    const firstError = result.error.errors[0];
    const path = firstError?.path.join(".") || "query";
    const message = firstError?.message || "Validation failed";
    return {
      success: false,
      error: badRequest(`${path}: ${message}`),
    };
  }

  return { success: true, data: result.data };
}

// --- Common schemas used across multiple routes ---

export const schemas = {
  /** UUID v4 string */
  uuid: z.string().uuid(),

  /** Non-empty trimmed string */
  nonEmptyString: z.string().trim().min(1),

  /** Valid email address */
  email: z.string().email().trim().toLowerCase(),

  /** Plan tier */
  planTier: z.enum(["starter", "growth", "pro"]),

  /** Lead scoring request */
  leadScore: z.object({
    lead_id: z.string().uuid("lead_id must be a valid UUID"),
  }),

  /** Sequence generation request */
  sequenceGenerate: z.object({
    campaign_id: z.string().uuid("campaign_id must be a valid UUID"),
  }),

  /** Sequence send request */
  sequenceSend: z.object({
    message_id: z.string().uuid("message_id must be a valid UUID"),
  }),

  /** Chat widget message */
  chatMessage: z.object({
    business_id: z.string().uuid("business_id must be a valid UUID"),
    conversation_id: z.string().uuid().optional(),
    message: z.string().min(1).max(500),
    visitor_name: z.string().max(100).optional(),
    visitor_email: z.string().email().optional(),
  }),

  /** Contact form submission */
  contactForm: z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().email("A valid email is required").trim(),
    message: z.string().trim().min(1, "Message is required").max(5000),
  }),

  /** Stripe checkout */
  stripeCheckout: z.object({
    plan: z.enum(["starter", "growth", "pro"]),
  }),

  /** Support ticket */
  supportTicket: z.object({
    subject: z.string().trim().min(1, "Subject is required").max(200),
    message: z.string().trim().min(1, "Message is required").max(5000),
    urgency: z.enum(["low", "medium", "high"]).default("medium"),
  }),

  /** White label config update */
  whiteLabelUpdate: z.object({
    app_name: z.string().trim().min(1).max(50).optional(),
    logo_url: z.string().url().nullable().optional(),
    primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional(),
    accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional(),
    favicon_url: z.string().url().nullable().optional(),
    hide_captivly_branding: z.boolean().optional(),
  }),

  /** Custom domain registration */
  customDomainRegister: z.object({
    domain: z
      .string()
      .trim()
      .min(4)
      .regex(
        /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z]{2,})+$/,
        "Invalid domain format"
      ),
  }),

  /** Agency creation */
  agencyCreate: z.object({
    name: z.string().trim().min(1, "Agency name is required").max(100),
    logo_url: z.string().url().nullable().optional(),
  }),

  /** Agency member invite */
  agencyMemberInvite: z.object({
    email: z.string().email("Valid email is required").trim(),
    role: z.enum(["admin", "member"]).default("member"),
  }),

  /** Referral link creation */
  referralCreate: z.object({
    referrer_name: z.string().trim().max(100).optional(),
    referrer_email: z.string().email().optional(),
  }),

  /** Deal creation */
  dealCreate: z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
    lead_id: z.string().uuid().optional(),
    stage_id: z.string().uuid().optional(),
    value_cents: z.number().int().min(0).default(0),
    expected_close_date: z.string().datetime().optional(),
    notes: z.string().max(5000).optional(),
  }),

  /** Pipeline stage creation */
  pipelineStageCreate: z.object({
    name: z.string().trim().min(1).max(50),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3b82f6"),
    is_won: z.boolean().default(false),
    is_lost: z.boolean().default(false),
  }),

  /** Pipeline automation creation */
  pipelineAutomationCreate: z.object({
    name: z.string().trim().min(1).max(100),
    trigger_stage_id: z.string().uuid(),
    action_type: z.enum(["send_email", "send_sms", "update_lead_status", "create_activity_note"]),
    action_config: z.object({
      subject: z.string().max(200).optional(),
      body: z.string().max(5000).optional(),
      lead_status: z.enum(["new", "in_sequence", "replied", "converted", "unsubscribed", "cold"]).optional(),
      note: z.string().max(5000).optional(),
    }),
    is_active: z.boolean().default(true),
  }),

  /** API key creation */
  apiKeyCreate: z.object({
    name: z.string().trim().min(1, "Key name is required").max(50),
  }),

  /** Zapier leads query */
  zapierLeadsQuery: z.object({
    status: z.enum(["new", "in_sequence", "replied", "converted", "unsubscribed", "cold"]).optional(),
    since: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }),
};
