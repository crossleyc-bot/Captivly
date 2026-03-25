import { getInternalAuthHeader } from "@/lib/internal-auth";
import { logger } from "@/lib/logger";

interface InternalFetchOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelayMs?: number;
  /** Context string for error logging */
  context?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fire-and-forget POST to an internal API endpoint with automatic retry
 * and exponential backoff. Does not block the caller.
 *
 * Replaces the raw `fetch(...).catch(console.error)` pattern used in
 * webhook handlers.
 */
export function internalFetch(
  path: string,
  body: Record<string, unknown>,
  options: InternalFetchOptions = {}
): void {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    context = path,
  } = options;

  const url = `${process.env.NEXT_PUBLIC_APP_URL}${path}`;

  const attempt = async (retryCount: number): Promise<void> => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getInternalAuthHeader(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok && retryCount < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, retryCount);
        logger.warn(`Internal fetch failed (${res.status}), retrying in ${delay}ms`, {
          context,
          attempt: retryCount + 1,
          maxRetries,
          status: res.status,
        });
        await sleep(delay);
        return attempt(retryCount + 1);
      }

      if (!res.ok) {
        logger.error(`Internal fetch failed after ${maxRetries} retries`, {
          context,
          status: res.status,
          url,
        });
      }
    } catch (err) {
      if (retryCount < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, retryCount);
        logger.warn(`Internal fetch error, retrying in ${delay}ms`, {
          context,
          attempt: retryCount + 1,
          error: err instanceof Error ? err.message : String(err),
        });
        await sleep(delay);
        return attempt(retryCount + 1);
      }

      logger.error(`Internal fetch failed permanently after ${maxRetries} retries`, {
        context,
        error: err instanceof Error ? err.message : String(err),
        url,
      });
    }
  };

  // Fire and forget — no await
  attempt(0).catch(() => {
    // Final safety net — should never reach here
  });
}

/**
 * Convenience: trigger AI lead scoring for a lead.
 */
export function triggerLeadScoring(leadId: string, source: string): void {
  internalFetch("/api/leads/score", { lead_id: leadId }, {
    context: `lead-scoring:${source}:${leadId}`,
  });
}

/**
 * Convenience: track a referral conversion.
 */
export function triggerReferralTracking(
  leadId: string,
  referralCode: string,
  source: string
): void {
  internalFetch(
    "/api/referrals/track",
    { lead_id: leadId, referral_code: referralCode },
    { context: `referral-track:${source}:${leadId}` }
  );
}
