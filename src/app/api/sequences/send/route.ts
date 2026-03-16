import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getResendClient } from "@/lib/resend";
import { getTwilioClient, TWILIO_FROM } from "@/lib/twilio";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface SendRequest {
  message_id: string;
}

export async function POST(request: NextRequest) {
  const { message_id } = (await request.json()) as SendRequest;

  if (!message_id) {
    return NextResponse.json({ error: "message_id required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Fetch message with related data
  const { data: message } = await supabase
    .from("messages_sent")
    .select("*, lead:leads(*), step:sequence_steps(*)")
    .eq("id", message_id)
    .single();

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (message.status !== "queued") {
    return NextResponse.json({ error: "Message already processed" }, { status: 400 });
  }

  const lead = message.lead;
  const step = message.step;

  if (!lead || !step) {
    await supabase
      .from("messages_sent")
      .update({ status: "failed" })
      .eq("id", message_id);
    return NextResponse.json({ error: "Missing lead or step data" }, { status: 400 });
  }

  // Check usage limits for SMS
  if (step.channel === "sms") {
    const month = new Date().toISOString().slice(0, 7);

    const { data: business } = await supabase
      .from("businesses")
      .select("id, user_id")
      .eq("id", lead.business_id)
      .single();

    if (business) {
      const { data: dbUser } = await supabase
        .from("users")
        .select("plan_tier")
        .eq("id", business.user_id)
        .single();

      const plan = dbUser?.plan_tier ?? "starter";
      const smsLimits: Record<string, number> = {
        starter: 0,
        growth: 500,
        pro: 2000,
      };

      const { data: usage } = await supabase
        .from("usage_tracking")
        .select("sms_count")
        .eq("business_id", business.id)
        .eq("month", month)
        .single();

      if ((usage?.sms_count ?? 0) >= (smsLimits[plan] ?? 0)) {
        await supabase
          .from("messages_sent")
          .update({ status: "failed" })
          .eq("id", message_id);
        return NextResponse.json(
          { error: "SMS limit reached for this billing period" },
          { status: 403 }
        );
      }
    }
  }

  try {
    let providerMessageId: string | null = null;

    if (step.channel === "email" && lead.email) {
      const resend = getResendClient();
      const result = await resend.emails.send({
        from: `Captivly <noreply@${process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "").replace("http://", "") ?? "captivly.ai"}>`,
        to: lead.email,
        subject: step.subject ?? "You have a new message",
        text: step.body,
      });

      providerMessageId = result.data?.id ?? null;

      // Increment email usage
      await supabase.rpc("increment_usage", {
        p_business_id: lead.business_id,
        p_month: new Date().toISOString().slice(0, 7),
        p_field: "emails_count",
      });
    } else if (step.channel === "sms" && lead.phone) {
      const twilioClient = getTwilioClient();
      const result = await twilioClient.messages.create({
        body: step.body,
        from: TWILIO_FROM,
        to: lead.phone,
      });

      providerMessageId = result.sid;

      // Increment SMS usage
      await supabase.rpc("increment_usage", {
        p_business_id: lead.business_id,
        p_month: new Date().toISOString().slice(0, 7),
        p_field: "sms_count",
      });
    } else {
      // No valid contact info for this channel
      await supabase
        .from("messages_sent")
        .update({ status: "failed" })
        .eq("id", message_id);
      return NextResponse.json(
        { error: `No ${step.channel === "email" ? "email" : "phone"} for this lead` },
        { status: 400 }
      );
    }

    // Mark as sent
    await supabase
      .from("messages_sent")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: providerMessageId,
      })
      .eq("id", message_id);

    // Update lead status to in_sequence if still new
    if (lead.status === "new") {
      await supabase
        .from("leads")
        .update({ status: "in_sequence" })
        .eq("id", lead.id);
    }

    return NextResponse.json({ sent: true, provider_message_id: providerMessageId });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown send error";

    await supabase
      .from("messages_sent")
      .update({ status: "failed" })
      .eq("id", message_id);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
