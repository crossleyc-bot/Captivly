import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { processInboundLead } from "@/lib/process-inbound-lead";
import { saveToDeadLetter } from "@/lib/webhook-dead-letter";

interface TikTokLeadData {
  lead_id: string;
  advertiser_id: string;
  form_id: string;
  leads: Array<{
    field_name: string;
    field_value: string;
  }>;
}

/**
 * Receives lead form submissions from TikTok Lead Generation.
 */
export async function POST(request: NextRequest) {
  const body: TikTokLeadData = await request.json();
  const { lead_id, advertiser_id, form_id, leads: leadFields } = body;

  if (!lead_id || !advertiser_id) {
    return NextResponse.json({ received: true });
  }

  const supabase = getServiceClient();

  // Find business by TikTok advertiser ID
  const { data: business } = await supabase
    .from("businesses")
    .select("id, tiktok_access_token")
    .eq("tiktok_advertiser_id", advertiser_id)
    .single();

  if (!business?.tiktok_access_token) {
    return NextResponse.json({ received: true });
  }

  // Parse lead field data from TikTok's format
  const fieldData: Record<string, string> = {};
  for (const field of leadFields ?? []) {
    if (field.field_name && field.field_value) {
      fieldData[field.field_name.toLowerCase()] = field.field_value;
    }
  }

  // Find campaign by tiktok_form_id
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("business_id", business.id)
    .eq("tiktok_form_id", form_id)
    .single();

  const result = await processInboundLead({
    source: "tiktok",
    businessId: business.id,
    campaignId: campaign?.id ?? null,
    platformLeadId: lead_id,
    platformLeadIdColumn: "tiktok_lead_id",
    fieldData,
    rawPayload: body as unknown as Record<string, unknown>,
  });

  if (!result.saved && result.skipReason === "insert_failed") {
    await saveToDeadLetter({
      source: "tiktok",
      payload: body as unknown as Record<string, unknown>,
      error_message: "Lead insert failed",
      business_id: business.id,
    });
  }

  return NextResponse.json({ received: true });
}
