import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getServiceClient } from "@/lib/supabase/service";
import { handleLeadReply } from "@/lib/reply-handler";

const TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
const TWIML_HEADERS = { "Content-Type": "text/xml" };

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

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Verify Twilio signature
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;
  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  const sortedParams = Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], "");
  const dataToSign = url + sortedParams;
  const computed = createHmac("sha1", authToken).update(dataToSign).digest("base64");

  if (computed !== twilioSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const from = params["From"] ?? null;

  if (!from) {
    return new NextResponse(TWIML_EMPTY, { headers: TWIML_HEADERS });
  }

  const supabase = getServiceClient();

  // Try matching by exact phone number first
  const { data: exactMatch } = await supabase
    .from("leads")
    .select("id")
    .eq("phone", from)
    .in("status", ["new", "in_sequence"])
    .limit(1)
    .single();

  let lead: { id: string } | null = exactMatch;

  if (!lead) {
    // Try common phone formats: +1XXXXXXXXXX, XXXXXXXXXX, (XXX) XXX-XXXX
    const digits = from.replace(/\D/g, "");
    const last10 = digits.slice(-10);

    if (last10.length === 10) {
      // Try with +1 prefix (E.164)
      const { data: e164Match } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", `+1${last10}`)
        .in("status", ["new", "in_sequence"])
        .limit(1)
        .single();

      lead = e164Match;

      // Try plain 10-digit
      if (!lead) {
        const { data: plainMatch } = await supabase
          .from("leads")
          .select("id")
          .eq("phone", last10)
          .in("status", ["new", "in_sequence"])
          .limit(1)
          .single();

        lead = plainMatch;
      }
    }
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
  return new NextResponse(TWIML_EMPTY, { headers: TWIML_HEADERS });
}
