import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { processInboundLead } from "@/lib/process-inbound-lead";
import { decryptToken } from "@/lib/token-encryption";
import { saveToDeadLetter } from "@/lib/webhook-dead-letter";

interface GooglePubSubMessage {
  message: {
    data: string; // base64-encoded JSON
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

interface GoogleLeadFormData {
  google_lead_id: string;
  campaign_id: string;
  form_id: string;
  customer_id: string;
  user_column_data: Array<{
    column_id: string;
    string_value: string;
  }>;
}

/**
 * Receives lead form submissions from Google Ads via Pub/Sub push.
 */
export async function POST(request: NextRequest) {
  const body: GooglePubSubMessage = await request.json();

  if (!body.message?.data) {
    return NextResponse.json({ error: "Missing message data" }, { status: 400 });
  }

  let leadPayload: GoogleLeadFormData;
  try {
    const decoded = Buffer.from(body.message.data, "base64").toString("utf-8");
    leadPayload = JSON.parse(decoded);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { google_lead_id, customer_id, form_id, user_column_data } = leadPayload;

  if (!google_lead_id || !customer_id) {
    return NextResponse.json({ received: true });
  }

  const supabase = getServiceClient();

  // Find business by Google customer ID
  const { data: business } = await supabase
    .from("businesses")
    .select("id, google_access_token, google_refresh_token")
    .eq("google_customer_id", customer_id)
    .single();

  if (!business?.google_access_token) {
    return NextResponse.json({ received: true });
  }

  // Decrypt token (backwards compatible)
  void decryptToken(business.google_access_token);

  // Parse user column data from Google's format
  const fieldData: Record<string, string> = {};
  for (const col of user_column_data ?? []) {
    if (col.column_id && col.string_value) {
      fieldData[col.column_id.toLowerCase()] = col.string_value;
    }
  }

  // Find campaign by google_form_id
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("business_id", business.id)
    .eq("google_form_id", form_id)
    .single();

  const result = await processInboundLead({
    source: "google",
    businessId: business.id,
    campaignId: campaign?.id ?? null,
    platformLeadId: google_lead_id,
    platformLeadIdColumn: "google_lead_id",
    fieldData,
    rawPayload: leadPayload as unknown as Record<string, unknown>,
  });

  if (!result.saved && result.skipReason === "insert_failed") {
    await saveToDeadLetter({
      source: "google",
      payload: leadPayload as unknown as Record<string, unknown>,
      error_message: "Lead insert failed",
      business_id: business.id,
    });
  }

  return NextResponse.json({ received: true });
}
