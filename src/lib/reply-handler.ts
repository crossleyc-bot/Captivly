import { getServiceClient } from "@/lib/supabase/service";

/**
 * Handles a reply from a lead:
 * 1. Updates the lead status to "replied"
 * 2. Marks the triggering message as "replied"
 * 3. Cancels all queued (unsent) messages for this lead
 *
 * This effectively pauses the sequence for this lead.
 */
export async function handleLeadReply(opts: {
  leadId: string;
  messageId?: string;
  channel: "email" | "sms";
  repliedAt?: string;
}): Promise<{ paused: boolean; cancelledCount: number }> {
  const supabase = getServiceClient();
  const repliedAt = opts.repliedAt ?? new Date().toISOString();

  // 1. Update lead status to "replied"
  await supabase
    .from("leads")
    .update({ status: "replied", updated_at: repliedAt })
    .eq("id", opts.leadId);

  // 2. Mark the specific message as replied (if we know which one)
  if (opts.messageId) {
    const { data: repliedMsg } = await supabase
      .from("messages_sent")
      .update({ status: "replied", replied_at: repliedAt })
      .eq("id", opts.messageId)
      .select("variant_id")
      .single();

    // Increment A/B variant reply count if applicable
    if (repliedMsg?.variant_id) {
      await supabase.rpc("increment_variant_replies", {
        p_variant_id: repliedMsg.variant_id,
      });
    }
  }

  // 3. Cancel all queued messages for this lead (sequence pause)
  const { data: cancelled } = await supabase
    .from("messages_sent")
    .update({ status: "failed" })
    .eq("lead_id", opts.leadId)
    .eq("status", "queued")
    .select("id");

  return {
    paused: true,
    cancelledCount: cancelled?.length ?? 0,
  };
}
