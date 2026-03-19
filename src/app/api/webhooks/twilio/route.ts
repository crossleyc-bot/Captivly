import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getServiceClient } from "@/lib/supabase/service";
import { handleLeadReply } from "@/lib/reply-handler";

/**
 * Receives inbound SMS from Twilio.
 *
 * When a lead replies to an outreach SMS, Twilio sends the inbound
 * message to this webhook. We match the sender's phone number to a
 * lead and pause their sequence.
 *
 * Twilio sends form-encoded data (not JSON).
 */
export async function POST(request: NextRequest) {
  // Validate Twilio request signature
  const twilioSignature = request.headers.get("x-twilio-signature");
  if (!twilioSignature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  // In production, validate the signature using twilio.validateRequest().
  // For now, ensure the auth token env var is set as a basic check.
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Parse the form-encoded body
  const formData = await request.formData();
  const from = formData.get("From") as string | null;
  const body = formData.get("Body") as string | null;
  const messageSid = formData.get("MessageSid") as string | null;

  if (!from) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  const supabase = getServiceClient();

  // Normalize phone: strip non-digits for matching
  // Twilio sends "+1XXXXXXXXXX" format
  const normalizedPhone = from.replace(/\D/g, "");

  // Find the lead by phone number (try exact match first, then normalized)
  let lead: { id: string } | null = null;

  const { data: exactMatch } = await supabase
    .from("leads")
    .select("id")
    .eq("phone", from)
    .in("status", ["new", "in_sequence"])
    .limit(1)
    .single();

  if (exactMatch) {
    lead = exactMatch;
  } else {
    // Try matching by the last 10 digits
    const last10 = normalizedPhone.slice(-10);
    const { data: leads } = await supabase
      .from("leads")
      .select("id, phone")
      .in("status", ["new", "in_sequence"]);

    lead =
      leads?.find(
        (l) => l.phone && l.phone.replace(/\D/g, "").slice(-10) === last10
      ) ?? null;
  }

  if (lead) {
    // Find the most recent sent SMS for this lead
    const { data: lastMessage } = await supabase
      .from("messages_sent")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("channel", "sms")
      .in("status", ["sent", "delivered"])
      .order("sent_at", { ascending: false })
      .limit(1)
      .single();

    await handleLeadReply({
      leadId: lead.id,
      messageId: lastMessage?.id,
      channel: "sms",
    });
  }

  // Respond with empty TwiML (Twilio requires XML response)
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { "Content-Type": "text/xml" } }
  );
}
