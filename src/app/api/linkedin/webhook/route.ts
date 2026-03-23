import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { getInternalAuthHeader } from "@/lib/internal-auth";
import { PLAN_LIMITS, LINKEDIN_API_BASE_URL } from "@/lib/constants";
import type { PlanTier } from "@/types/database";

interface LinkedInWebhookBody {
  input: {
    leadGenFormUrn: string;
    leadGenFormResponseUrn: string;
    sponsoredAccountUrn: string;
    sponsoredCampaignUrn: string;
  };
}

/**
 * Receives lead form submissions from LinkedIn Lead Gen Forms.
 *
 * LinkedIn sends a webhook when a user submits a Lead Gen Form on a
 * Sponsored Content ad. The payload contains URNs for the form response,
 * account, and campaign. We then fetch the full lead data from LinkedIn API.
 */
export async function POST(request: NextRequest) {
  const body: LinkedInWebhookBody = await request.json();

  const {
    leadGenFormUrn,
    leadGenFormResponseUrn,
    sponsoredAccountUrn,
  } = body.input ?? {};

  if (!leadGenFormResponseUrn || !sponsoredAccountUrn) {
    return NextResponse.json({ received: true });
  }

  // Extract IDs from URNs
  const adAccountId = sponsoredAccountUrn.replace(
    "urn:li:sponsoredAccount:",
    ""
  );
  const formId = leadGenFormUrn?.replace("urn:li:leadGenForm:", "") ?? null;
  const responseId = leadGenFormResponseUrn.replace(
    "urn:li:leadGenFormResponse:",
    ""
  );

  const supabase = getServiceClient();

  // Find business by LinkedIn ad account ID
  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, linkedin_access_token, type, primary_offer, target_age_min, target_age_max, target_interests"
    )
    .eq("linkedin_ad_account_id", adAccountId)
    .single();

  if (!business?.linkedin_access_token) {
    return NextResponse.json({ received: true });
  }

  // Deduplicate: skip if lead already exists
  const { count: existingCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("linkedin_lead_id", responseId);

  if ((existingCount ?? 0) > 0) {
    return NextResponse.json({ received: true });
  }

  // Fetch full lead response data from LinkedIn API
  const fieldData: Record<string, string> = {};
  try {
    const leadRes = await fetch(
      `${LINKEDIN_API_BASE_URL}/leadGenFormResponses/${encodeURIComponent(leadGenFormResponseUrn)}`,
      {
        headers: {
          Authorization: `Bearer ${business.linkedin_access_token}`,
          "LinkedIn-Version": "202401",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    if (leadRes.ok) {
      const leadData = await leadRes.json();
      // LinkedIn returns answers as array of { fieldName, value }
      for (const answer of leadData.answers ?? []) {
        if (answer.fieldName && answer.value) {
          fieldData[answer.fieldName.toLowerCase()] = answer.value;
        }
      }
    }
  } catch {
    // If we can't fetch lead data, still save what we can
  }

  // Find campaign by linkedin_form_id
  const { data: campaign } = formId
    ? await supabase
        .from("campaigns")
        .select("id")
        .eq("business_id", business.id)
        .eq("linkedin_form_id", formId)
        .single()
    : { data: null };

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
        linkedin_lead_id: responseId,
        first_name:
          fieldData.firstname ?? fieldData.first_name ?? null,
        last_name:
          fieldData.lastname ?? fieldData.last_name ?? null,
        email: fieldData.email ?? null,
        phone: fieldData.phonenumber ?? fieldData.phone ?? null,
        custom_answers: fieldData,
        status: "new",
        source: "linkedin",
      },
      { onConflict: "linkedin_lead_id", ignoreDuplicates: true }
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
      console.error(`Failed to track referral for LinkedIn lead ${lead.id}:`, err);
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
    console.error(`Failed to trigger scoring for LinkedIn lead ${lead.id}:`, err);
  });

  return NextResponse.json({ received: true });
}
