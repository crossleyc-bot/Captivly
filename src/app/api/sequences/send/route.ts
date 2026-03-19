import { NextRequest, NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend";
import { getTwilioClient, TWILIO_FROM } from "@/lib/twilio";
import { validateInternalAuth } from "@/lib/internal-auth";
import { getServiceClient } from "@/lib/supabase/service";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/types/database";

interface SendRequest {
  message_id: string;
}

export async function POST(request: NextRequest) {
  const authError = validateInternalAuth(request);
  if (authError) return authError;

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

  // If a variant was assigned, use its subject/body instead of the step defaults
  let effectiveSubject: string | null = step?.subject ?? null;
  let effectiveBody: string = step?.body ?? "";

  if (message.variant_id) {
    const { data: variant } = await supabase
      .from("sequence_step_variants")
      .select("subject, body")
      .eq("id", message.variant_id)
      .single();

    if (variant) {
      effectiveSubject = variant.subject ?? effectiveSubject;
      effectiveBody = variant.body;
    }
  }

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

      const plan = (dbUser?.plan_tier ?? "starter") as PlanTier;

      const { data: usage } = await supabase
        .from("usage_tracking")
        .select("sms_count")
        .eq("business_id", business.id)
        .eq("month", month)
        .single();

      if ((usage?.sms_count ?? 0) >= PLAN_LIMITS[plan].sms_per_month) {
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
        subject: effectiveSubject ?? "You have a new message",
        text: effectiveBody,
      });

      if (result.error) {
        throw new Error(`Email send failed: ${result.error.message}`);
      }

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
        body: effectiveBody,
        from: TWILIO_FROM,
        to: lead.phone,
      });

      if (result.errorCode) {
        throw new Error(`SMS send failed: ${result.errorMessage ?? `error code ${result.errorCode}`}`);
      }

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

    // Increment variant send count for A/B tracking
    if (message.variant_id) {
      await supabase.rpc("increment_variant_sends", {
        p_variant_id: message.variant_id,
      });
    }

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
