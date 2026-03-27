import { NextRequest, NextResponse } from "next/server";
import { validateInternalAuth, getInternalAuthHeader } from "@/lib/internal-auth";
import { logger } from "@/lib/logger";
import { processDeadLetterQueue } from "./dead-letter-retry";
import { resetMonthlyUsage } from "./usage-reset";

const VALID_JOBS = [
  "sequence-scheduler",
  "report-cards",
  "dead-letter-retry",
  "usage-reset",
] as const;

type CronJob = (typeof VALID_JOBS)[number];

function isValidJob(job: string): job is CronJob {
  return (VALID_JOBS as readonly string[]).includes(job);
}

/**
 * Unified cron endpoint for all scheduled jobs.
 *
 * GET /api/cron?job=sequence-scheduler  — runs every hour
 * GET /api/cron?job=report-cards        — runs on 1st of month
 * GET /api/cron?job=dead-letter-retry   — runs every 15 minutes
 * GET /api/cron?job=usage-reset         — runs on 1st of month
 *
 * All jobs require internal auth via Authorization: Bearer <INTERNAL_API_SECRET>.
 */
export async function GET(request: NextRequest) {
  const authError = validateInternalAuth(request);
  if (authError) return authError;

  const job = request.nextUrl.searchParams.get("job");

  if (!job) {
    return NextResponse.json(
      { error: "Missing required query parameter: job" },
      { status: 400 }
    );
  }

  if (!isValidJob(job)) {
    return NextResponse.json(
      { error: `Invalid job name: ${job}. Valid jobs: ${VALID_JOBS.join(", ")}` },
      { status: 400 }
    );
  }

  const startTime = Date.now();
  logger.info(`Cron job started: ${job}`, { job });

  try {
    const result = await dispatch(job);
    const durationMs = Date.now() - startTime;

    logger.info(`Cron job completed: ${job}`, {
      job,
      durationMs,
      result,
    });

    return NextResponse.json({
      job,
      status: "completed",
      durationMs,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    logger.error(`Cron job failed: ${job}`, {
      job,
      durationMs,
      error: errorMessage,
    });

    return NextResponse.json(
      {
        job,
        status: "failed",
        durationMs,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Dispatches to the appropriate job handler.
 */
async function dispatch(job: CronJob): Promise<Record<string, unknown>> {
  switch (job) {
    case "sequence-scheduler":
      return runSequenceScheduler();
    case "report-cards":
      return runReportCards();
    case "dead-letter-retry":
      return runDeadLetterRetry();
    case "usage-reset":
      return runUsageReset();
  }
}

/**
 * Proxies to the existing sequence scheduler POST endpoint.
 */
async function runSequenceScheduler(): Promise<Record<string, unknown>> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/sequences/scheduler`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getInternalAuthHeader(),
    },
  });

  if (!res.ok) {
    throw new Error(`Sequence scheduler returned HTTP ${res.status}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

/**
 * Proxies to the existing report generation POST endpoint.
 */
async function runReportCards(): Promise<Record<string, unknown>> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/generate`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getInternalAuthHeader(),
    },
  });

  if (!res.ok) {
    throw new Error(`Report generator returned HTTP ${res.status}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

/**
 * Processes the dead letter queue directly via the helper module.
 */
async function runDeadLetterRetry(): Promise<Record<string, unknown>> {
  const result = await processDeadLetterQueue();
  return {
    processed: result.processed,
    failed: result.failed,
    skipped: result.skipped,
  };
}

/**
 * Resets monthly usage counters via the helper module.
 */
async function runUsageReset(): Promise<Record<string, unknown>> {
  const result = await resetMonthlyUsage();
  return { created: result.created };
}
