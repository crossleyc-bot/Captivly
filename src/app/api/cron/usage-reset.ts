import { getServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";

export interface UsageResetResult {
  created: number;
}

/**
 * Creates fresh usage_tracking rows for the current month for all
 * businesses with active subscriptions.
 *
 * Called on the 1st of each month to ensure every active business
 * starts with a clean usage counter. Uses upsert with
 * ignoreDuplicates to avoid conflicts if run more than once.
 */
export async function resetMonthlyUsage(): Promise<UsageResetResult> {
  const supabase = getServiceClient();
  const month = new Date().toISOString().slice(0, 7); // e.g. '2026-03'

  // Find all businesses whose owner has an active subscription
  const { data: businesses, error: fetchError } = await supabase
    .from("businesses")
    .select("id, user_id, users!inner(subscription_status)")
    .eq("users.subscription_status", "active");

  if (fetchError) {
    logger.error("Usage reset: failed to fetch active businesses", {
      error: fetchError.message,
    });
    return { created: 0 };
  }

  if (!businesses || businesses.length === 0) {
    logger.info("Usage reset: no active businesses found");
    return { created: 0 };
  }

  const rows = businesses.map((b) => ({
    business_id: b.id as string,
    month,
    leads_count: 0,
    sms_count: 0,
    emails_count: 0,
  }));

  // Upsert with ignoreDuplicates so re-running is safe
  const { count, error: upsertError } = await supabase
    .from("usage_tracking")
    .upsert(rows, {
      onConflict: "business_id,month",
      ignoreDuplicates: true,
      count: "exact",
    });

  if (upsertError) {
    logger.error("Usage reset: upsert failed", {
      error: upsertError.message,
      month,
    });
    return { created: 0 };
  }

  const created = count ?? rows.length;

  logger.info("Usage reset completed", { month, created });

  return { created };
}
