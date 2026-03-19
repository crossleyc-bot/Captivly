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

    if (!leads?.length) continue;

    // Batch-fetch existing messages for all leads in this sequence
    // to avoid N+1 queries per lead×step
    const leadIds = leads.map((l) => l.id);
    const stepIds = steps.map((s) => s.id);

    const { data: existingMessages } = await supabase
      .from("messages_sent")
      .select("lead_id, sequence_step_id")
      .in("lead_id", leadIds)
      .in("sequence_step_id", stepIds);

    const existingSet = new Set(
      (existingMessages ?? []).map(
        (m) => `${m.lead_id}:${m.sequence_step_id}`
      )
    );

    // Batch-fetch A/B variants for all steps at once
    const { data: allVariants } = await supabase
      .from("sequence_step_variants")
      .select("id, sequence_step_id")
      .in("sequence_step_id", stepIds);

    const variantsByStep = new Map<string, string[]>();
    for (const v of allVariants ?? []) {
      const list = variantsByStep.get(v.sequence_step_id) ?? [];
      list.push(v.id);
      variantsByStep.set(v.sequence_step_id, list);
    }

    // Build batch of messages to insert
    const messagesToInsert: Array<{
      lead_id: string;
      sequence_step_id: string;
      channel: null;
      to_address: null;
      subject: null;
      body: null;
      status: string;
      sent_at: string;
      variant_id: string | null;
    }> = [];

    for (const lead of leads) {
      for (const step of steps) {
        const key = `${lead.id}:${step.id}`;
        if (existingSet.has(key)) continue;

        // Calculate scheduled send time
        const leadCreated = new Date(lead.created_at);
        const scheduledAt = new Date(
          leadCreated.getTime() + step.delay_days * 24 * 60 * 60 * 1000
        );

        // Pick a random A/B variant if any exist for this step
        let variantId: string | null = null;
        const variants = variantsByStep.get(step.id);
        if (variants && variants.length > 0) {
          variantId = variants[Math.floor(Math.random() * variants.length)];
        }

        messagesToInsert.push({
          lead_id: lead.id,
          sequence_step_id: step.id,
          channel: null,
          to_address: null,
          subject: null,
          body: null,
          status: "queued",
          sent_at: scheduledAt.toISOString(),
          variant_id: variantId,
        });
      }
    }

    // Batch insert all messages at once
    if (messagesToInsert.length > 0) {
      const { count } = await supabase
        .from("messages_sent")
        .insert(messagesToInsert, { count: "exact" });
      queued += count ?? messagesToInsert.length;
    }
  }

  // --- Job 2: Send queued messages whose time has come ---

  const { data: dueMessages } = await supabase
    .from("messages_sent")
    .select("id")
    .eq("status", "queued")
    .lte("sent_at", now.toISOString())
    .limit(MAX_MESSAGES_PER_BATCH);

  // Send messages concurrently in batches of 10 for better throughput
  const CONCURRENCY = 10;
  const msgs = dueMessages ?? [];

  for (let i = 0; i < msgs.length; i += CONCURRENCY) {
    const batch = msgs.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((msg) =>
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sequences/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getInternalAuthHeader(),
          },
          body: JSON.stringify({ message_id: msg.id }),
        })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.ok) {
        sent++;
      }
    }
  }

  return NextResponse.json({
    queued,
    sent,
    due: msgs.length,
    timestamp: now.toISOString(),
  });
}
