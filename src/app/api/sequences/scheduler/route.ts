import { NextRequest, NextResponse } from "next/server";
import { validateInternalAuth, getInternalAuthHeader } from "@/lib/internal-auth";
import { getServiceClient } from "@/lib/supabase/service";

const MAX_SEQUENCES_PER_RUN = 50;
const MAX_LEADS_PER_SEQUENCE = 500;
const MAX_MESSAGES_PER_BATCH = 100;

/**
 * Sequence scheduler — called via cron (e.g. every hour).
 *
 * Two jobs:
 * 1. Queue messages for new leads entering active sequences
 * 2. Send queued messages whose scheduled time has arrived
 */
export async function POST(request: NextRequest) {
  const authError = validateInternalAuth(request);
  if (authError) return authError;
  const supabase = getServiceClient();
  const now = new Date();
  let queued = 0;
  let sent = 0;

  // --- Job 1: Queue messages for leads that don't have messages yet ---

  // Find active sequences
  const { data: sequences } = await supabase
    .from("sequences")
    .select("id, campaign_id")
    .eq("is_active", true)
    .limit(MAX_SEQUENCES_PER_RUN);

  for (const seq of sequences ?? []) {
    // Get all steps for this sequence
    const { data: steps } = await supabase
      .from("sequence_steps")
      .select("id, delay_days")
      .eq("sequence_id", seq.id)
      .order("step_number", { ascending: true });

    if (!steps?.length) continue;

    // Find leads in this campaign that are eligible (new or in_sequence)
    const { data: leads } = await supabase
      .from("leads")
      .select("id, created_at")
      .eq("campaign_id", seq.campaign_id)
      .in("status", ["new", "in_sequence"])
      .limit(MAX_LEADS_PER_SEQUENCE);

    for (const lead of leads ?? []) {
      for (const step of steps) {
        // Check if message already exists for this lead + step
        const { count } = await supabase
          .from("messages_sent")
          .select("id", { count: "exact", head: true })
          .eq("lead_id", lead.id)
          .eq("sequence_step_id", step.id);

        if ((count ?? 0) > 0) continue;

        // Calculate scheduled send time
        const leadCreated = new Date(lead.created_at);
        const scheduledAt = new Date(
          leadCreated.getTime() + step.delay_days * 24 * 60 * 60 * 1000
        );

        // Pick a random A/B variant if any exist for this step
        let variantId: string | null = null;
        const { data: variants } = await supabase
          .from("sequence_step_variants")
          .select("id")
          .eq("sequence_step_id", step.id);

        if (variants && variants.length > 0) {
          const picked = variants[Math.floor(Math.random() * variants.length)];
          variantId = picked.id;
        }

        // Queue the message
        await supabase.from("messages_sent").insert({
          lead_id: lead.id,
          sequence_step_id: step.id,
          channel: null, // filled from step when sending
          to_address: null, // filled when sending
          subject: null,
          body: null,
          status: "queued",
          sent_at: scheduledAt.toISOString(),
          variant_id: variantId,
        });

        queued++;
      }
    }
  }

  // --- Job 2: Send queued messages whose time has come ---

  const { data: dueMessages } = await supabase
    .from("messages_sent")
    .select("id")
    .eq("status", "queued")
    .lte("sent_at", now.toISOString())
    .limit(MAX_MESSAGES_PER_BATCH);

  for (const msg of dueMessages ?? []) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/sequences/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getInternalAuthHeader(),
          },
          body: JSON.stringify({ message_id: msg.id }),
        }
      );

      if (res.ok) sent++;
    } catch {
      // Individual failures don't block the batch
    }
  }

  return NextResponse.json({
    queued,
    sent,
    due: dueMessages?.length ?? 0,
    timestamp: now.toISOString(),
  });
}
