import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { getServiceClient } from "@/lib/supabase/service";
import { handleLeadReply } from "@/lib/reply-handler";

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
  };
}

/**
 * Receives webhook events from Resend (email provider).
 *
 * We listen for "email.replied" events to detect when a lead
 * responds to an outreach email, then pause their sequence.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  const rawBody = await request.text();

  // Verify webhook signature using Svix
  if (webhookSecret) {
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing webhook signature headers" }, { status: 401 });
    }

    try {
      const wh = new Webhook(webhookSecret);
      wh.verify(rawBody, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // We only care about delivery confirmations and replies
  if (event.type === "email.delivered") {
    // Mark message as delivered
    const supabase = getServiceClient();
    await supabase
      .from("messages_sent")
      .update({
        status: "delivered",
        delivered_at: event.created_at,
      })
      .eq("provider_message_id", event.data.email_id)
      .eq("status", "sent");

    return NextResponse.json({ received: true });
  }

  if (event.type === "email.bounced" || event.type === "email.complained") {
    // Mark as failed so we don't keep sending
    const supabase = getServiceClient();
    await supabase
      .from("messages_sent")
      .update({ status: "failed" })
      .eq("provider_message_id", event.data.email_id);

    return NextResponse.json({ received: true });
  }

  // For reply detection: Resend doesn't have a native "replied" event,
  // but we can detect replies via inbound emails. When a lead replies
  // to an outreach email, it arrives as an inbound email to our domain.
  // We match by the "to" address being our outreach email.
  if (event.type === "email.received") {
    const supabase = getServiceClient();

    // Find the lead by the sender's email address
    const fromEmail = event.data.from;
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", fromEmail)
      .in("status", ["new", "in_sequence"])
      .single();

    if (lead) {
      // Find the most recent sent message for this lead
      const { data: lastMessage } = await supabase
        .from("messages_sent")
        .select("id")
        .eq("lead_id", lead.id)
        .eq("channel", "email")
        .in("status", ["sent", "delivered"])
        .order("sent_at", { ascending: false })
        .limit(1)
        .single();

      await handleLeadReply({
        leadId: lead.id,
        messageId: lastMessage?.id,
        channel: "email",
        repliedAt: event.created_at,
      });
    }

    return NextResponse.json({ received: true });
  }

  // Acknowledge other event types
  return NextResponse.json({ received: true });
}
