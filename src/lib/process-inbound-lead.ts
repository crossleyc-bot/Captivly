import { getServiceClient } from "@/lib/supabase/service";
import { PLAN_LIMITS } from "@/lib/constants";
import { triggerLeadScoring, triggerReferralTracking } from "@/lib/internal-fetch";
import { saveToDeadLetter, type WebhookSource } from "@/lib/webhook-dead-letter";
import { logger } from "@/lib/logger";
import type { PlanTier } from "@/types/database";

interface InboundLeadData {
  /** Which ad platform the lead came from */
  source: WebhookSource & ("meta" | "google" | "tiktok" | "linkedin");
  /** Business ID this lead belongs to */
  businessId: string;
  /** Campaign ID (if matched) */
  campaignId: string | null;
  /** Platform-specific lead ID for dedup (e.g., meta_lead_id, google_lead_id) */
  platformLeadId: string;
  /** Column name for the platform lead ID (e.g., "meta_lead_id") */
  platformLeadIdColumn: string;
  /** Parsed field data from the platform */
  fieldData: Record<string, string>;
  /** Raw webhook payload for dead-letter storage */
  rawPayload?: Record<string, unknown>;
}

interface ProcessResult {
  /** Whether the lead was successfully saved */
  saved: boolean;
  /** The saved lead record (if successful) */
  lead?: Record<string, unknown>;
  /** Reason the lead was skipped */
  skipReason?: "duplicate" | "over_limit" | "insert_failed";
}

/**
 * Shared lead processing logic used by all webhook handlers (Meta, Google, TikTok, LinkedIn).
 *
 * Handles:
 * - Deduplication by platform lead ID
 * - Usage limit checking
 * - Lead upsert with standardized field parsing
 * - Usage increment
 * - Campaign leads count increment
 * - Referral tracking (fire-and-forget)
 * - AI lead scoring trigger (fire-and-forget with retry)
 * - Dead-letter storage on failure
 */
export async function processInboundLead(data: InboundLeadData): Promise<ProcessResult> {
  const supabase = getServiceClient();
  const {
    source,
    businessId,
    campaignId,
    platformLeadId,
    platformLeadIdColumn,
    fieldData,
  } = data;

  // 1. Deduplicate
  const { count: existingCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq(platformLeadIdColumn, platformLeadId);

  if ((existingCount ?? 0) > 0) {
    return { saved: false, skipReason: "duplicate" };
  }

  // 2. Check usage limits
  const month = new Date().toISOString().slice(0, 7);
  const { data: userRow } = await supabase
    .from("businesses")
    .select("user_id")
    .eq("id", businessId)
    .single();

  if (userRow) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("plan_tier")
      .eq("id", userRow.user_id)
      .single();

    const plan = (dbUser?.plan_tier ?? "starter") as PlanTier;

    const { data: usage } = await supabase
      .from("usage_tracking")
      .select("leads_count")
      .eq("business_id", businessId)
      .eq("month", month)
      .single();

    if ((usage?.leads_count ?? 0) >= PLAN_LIMITS[plan].leads_per_month) {
      return { saved: false, skipReason: "over_limit" };
    }
  }

  // 3. Parse name fields
  const firstName =
    fieldData.full_name?.split(" ")[0] ??
    fieldData.firstname ??
    fieldData.first_name ??
    null;
  const lastName =
    fieldData.full_name?.split(" ").slice(1).join(" ") ??
    fieldData.lastname ??
    fieldData.last_name ??
    null;

  // 4. Upsert lead
  const leadRecord: Record<string, unknown> = {
    business_id: businessId,
    campaign_id: campaignId,
    [platformLeadIdColumn]: platformLeadId,
    first_name: firstName,
    last_name: lastName,
    email: fieldData.email ?? null,
    phone: fieldData.phone_number ?? fieldData.phone ?? fieldData.phonenumber ?? null,
    custom_answers: fieldData,
    status: "new",
    source,
  };

  const { data: lead } = await supabase
    .from("leads")
    .upsert(leadRecord, { onConflict: platformLeadIdColumn, ignoreDuplicates: true })
    .select()
    .single();

  if (!lead) {
    // Save to dead letter for reprocessing
    if (data.rawPayload) {
      await saveToDeadLetter({
        source,
        payload: data.rawPayload,
        error_message: "Lead upsert returned no data",
        business_id: businessId,
      });
    }
    return { saved: false, skipReason: "insert_failed" };
  }

  // 5. Increment usage
  await supabase.rpc("increment_usage", {
    p_business_id: businessId,
    p_month: month,
    p_field: "leads_count",
  });

  // 6. Update campaign leads count
  if (campaignId) {
    await supabase.rpc("increment_campaign_leads", {
      p_campaign_id: campaignId,
    });
  }

  // 7. Check for referral code
  const referralCode =
    fieldData.referral_code ??
    fieldData.ref ??
    fieldData.referred_by ??
    null;

  if (referralCode && typeof referralCode === "string") {
    triggerReferralTracking(lead.id as string, referralCode, source);
  }

  // 8. Trigger AI lead scoring (with retry)
  triggerLeadScoring(lead.id as string, source);

  logger.info(`Lead processed from ${source}`, {
    leadId: lead.id,
    businessId,
    source,
  });

  return { saved: true, lead };
}
