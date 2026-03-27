import {
  getPendingDeadLetters,
  markDeadLetterProcessed,
  markDeadLetterRetried,
  markDeadLetterFailed,
  type WebhookSource,
} from "@/lib/webhook-dead-letter";
import { getInternalAuthHeader } from "@/lib/internal-auth";
import { logger } from "@/lib/logger";

const MAX_RETRIES = 5;

/**
 * Maps a dead letter source to the internal webhook route that should
 * reprocess the payload.
 */
function getWebhookUrl(source: WebhookSource): string | null {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const routes: Partial<Record<WebhookSource, string>> = {
    meta: "/api/meta/webhook",
    google: "/api/google/webhook",
    stripe: "/api/stripe/webhook",
    resend: "/api/webhooks/resend",
    twilio: "/api/webhooks/twilio",
  };
  const path = routes[source];
  return path ? `${base}${path}` : null;
}

export interface DeadLetterResult {
  processed: number;
  failed: number;
  skipped: number;
}

/**
 * Processes the dead letter queue by re-dispatching pending entries
 * to their original webhook handlers.
 *
 * - Entries with retry_count >= 5 are marked as permanently failed.
 * - Successful re-dispatches are marked as processed.
 * - Failed re-dispatches have their retry_count incremented.
 */
export async function processDeadLetterQueue(): Promise<DeadLetterResult> {
  const entries = await getPendingDeadLetters(50);

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const entry of entries) {
    const url = getWebhookUrl(entry.source);

    if (!url) {
      logger.warn("Dead letter retry: unknown source, skipping", {
        id: entry.id,
        source: entry.source,
      });
      skipped++;
      continue;
    }

    // If this is the 5th attempt (retry_count is 4, meaning 0-indexed 5th try),
    // mark as permanently failed regardless of outcome
    if (entry.retry_count >= MAX_RETRIES - 1) {
      await markDeadLetterFailed(entry.id);
      failed++;
      logger.warn("Dead letter permanently failed after max retries", {
        id: entry.id,
        source: entry.source,
        retryCount: entry.retry_count,
      });
      continue;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getInternalAuthHeader(),
        },
        body: JSON.stringify(entry.payload),
      });

      if (res.ok) {
        await markDeadLetterProcessed(entry.id);
        processed++;
        logger.info("Dead letter reprocessed successfully", {
          id: entry.id,
          source: entry.source,
        });
      } else {
        const errorMsg = `HTTP ${res.status}: ${res.statusText}`;
        await markDeadLetterRetried(entry.id, errorMsg);
        failed++;
        logger.warn("Dead letter retry failed", {
          id: entry.id,
          source: entry.source,
          status: res.status,
          retryCount: entry.retry_count + 1,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await markDeadLetterRetried(entry.id, errorMsg);
      failed++;
      logger.error("Dead letter retry threw an exception", {
        id: entry.id,
        source: entry.source,
        error: errorMsg,
        retryCount: entry.retry_count + 1,
      });
    }
  }

  return { processed, failed, skipped };
}
