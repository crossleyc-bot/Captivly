import { getServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";

export type WebhookSource = "meta" | "google" | "tiktok" | "linkedin" | "stripe" | "resend" | "twilio";

interface DeadLetterEntry {
  source: WebhookSource;
  payload: Record<string, unknown>;
  error_message: string;
  retry_count?: number;
  business_id?: string;
}

/**
 * Saves a failed webhook payload for later reprocessing.
 * Use this when a webhook handler encounters a transient error
 * (database timeout, external API failure) so the lead isn't lost.
 */
export async function saveToDeadLetter(entry: DeadLetterEntry): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase.from("webhook_dead_letters").insert({
    source: entry.source,
    payload: entry.payload,
    error_message: entry.error_message,
    retry_count: entry.retry_count ?? 0,
    status: "pending",
    business_id: entry.business_id ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    // Last resort: log the payload so it's not completely lost
    logger.error("Failed to save dead letter", {
      source: entry.source,
      dbError: error.message,
      payload: JSON.stringify(entry.payload).slice(0, 500),
    });
  } else {
    logger.info("Webhook payload saved to dead letter queue", {
      source: entry.source,
      error: entry.error_message,
    });
  }
}

/**
 * Retrieves pending dead letter entries for reprocessing.
 * Called by the scheduler/cron job.
 */
export async function getPendingDeadLetters(
  limit: number = 50
): Promise<Array<{
  id: string;
  source: WebhookSource;
  payload: Record<string, unknown>;
  retry_count: number;
}>> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("webhook_dead_letters")
    .select("id, source, payload, retry_count")
    .eq("status", "pending")
    .lt("retry_count", 5) // Max 5 retries
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    logger.error("Failed to fetch dead letters", { error: error.message });
    return [];
  }

  return (data ?? []) as Array<{
    id: string;
    source: WebhookSource;
    payload: Record<string, unknown>;
    retry_count: number;
  }>;
}

/**
 * Marks a dead letter entry as successfully processed.
 */
export async function markDeadLetterProcessed(id: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("webhook_dead_letters")
    .update({ status: "processed", processed_at: new Date().toISOString() })
    .eq("id", id);
}

/**
 * Increments the retry count on a dead letter entry after a failed retry.
 */
export async function markDeadLetterRetried(id: string, errorMessage: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("webhook_dead_letters")
    .update({
      retry_count: (await supabase
        .from("webhook_dead_letters")
        .select("retry_count")
        .eq("id", id)
        .single()
        .then(r => (r.data?.retry_count ?? 0) + 1)),
      error_message: errorMessage,
      last_retried_at: new Date().toISOString(),
    })
    .eq("id", id);
}

/**
 * Marks a dead letter as permanently failed (max retries exceeded).
 */
export async function markDeadLetterFailed(id: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("webhook_dead_letters")
    .update({ status: "failed" })
    .eq("id", id);
}
