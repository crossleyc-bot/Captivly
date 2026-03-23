import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { getInternalAuthHeader } from "@/lib/internal-auth";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/types/database";

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
 *
 * TikTok sends lead data via webhook when a user submits an Instant Form
 * on a TikTok ad. The payload contains lead answers and advertiser/form
 * identifiers for matching to a business and campaign.
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
    .select(
      "id, tiktok_access_token, type, primary_offer, target_age_min, target_age_max, target_interests"
    )
    .eq("tiktok_advertiser_id", advertiser_id)
    .single();

  if (!business?.tiktok_access_token) {
    return NextResponse.json({ received: true });
  }

  // Deduplicate: skip if lead already exists
  const { count: existingCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("tiktok_lead_id", lead_id);

  if ((existingCount ?? 0) > 0) {
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

  // Check lead usage limit
  const month = new Date().toISOString().slice(0, 7);
  const { data: userRow } = await supabase
    .from("businesses")
    .select("user_id")
    .eq("id", business.id)
    .single();

  if (userRow) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("plan_tier")
      .eq("id", userRow.user_id)
      .single();

    const plan = (dbUser?.plan_tier ?? "starter") as PlanTier;

    const { data: usage } = await supabase
      .from("usage_tracking")
      .select("leads_count")
      .eq("business_id", business.id)
      .eq("month", month)
      .single();

    if ((usage?.leads_count ?? 0) >= PLAN_LIMITS[plan].leads_per_month) {
      return NextResponse.json({ received: true });
    }
  }

  // Save lead (upsert to handle race conditions with concurrent webhooks)
  const { data: lead } = await supabase
    .from("leads")
    .upsert(
      {
        business_id: business.id,
        campaign_id: campaign?.id ?? null,
        tiktok_lead_id: lead_id,
        first_name:
          fieldData.full_name?.split(" ")[0] ??
          fieldData.first_name ??
          null,
        last_name:
          fieldData.full_name?.split(" ").slice(1).join(" ") ??
          fieldData.last_name ??
          null,
        email: fieldData.email ?? null,
        phone: fieldData.phone_number ?? fieldData.phone ?? null,
        custom_answers: fieldData,
        status: "new",
        source: "tiktok",
      },
      { onConflict: "tiktok_lead_id", ignoreDuplicates: true }
    )
    .select()
    .single();

  if (!lead) {
    return NextResponse.json({ received: true });
  }

  // Increment usage
  await supabase.rpc("increment_usage", {
    p_business_id: business.id,
    p_month: month,
    p_field: "leads_count",
  });

  // Update campaign leads count
  if (campaign?.id) {
    await supabase.rpc("increment_campaign_leads", {
      p_campaign_id: campaign.id,
    });
  }

  // Check for referral code in custom answers
  const referralCode =
    fieldData.referral_code ??
    fieldData.ref ??
    fieldData.referred_by ??
    null;

  if (referralCode && typeof referralCode === "string") {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/referrals/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getInternalAuthHeader(),
      },
      body: JSON.stringify({
        lead_id: lead.id,
        referral_code: referralCode,
      }),
    }).catch((err) => {
      console.error(`Failed to track referral for TikTok lead ${lead.id}:`, err);
    });
  }

  // Fire-and-forget: trigger AI lead scoring
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/leads/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getInternalAuthHeader(),
    },
    body: JSON.stringify({ lead_id: lead.id }),
  }).catch((err) => {
    console.error(`Failed to trigger scoring for TikTok lead ${lead.id}:`, err);
  });

  return NextResponse.json({ received: true });
}
