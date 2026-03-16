import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUsageLimit } from "@/lib/feature-gate";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/types/database";

interface CreateCampaignBody {
  name: string;
  daily_budget_cents: number;
  target_url?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const plan = (dbUser?.plan_tier ?? "starter") as PlanTier;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, meta_ad_account_id, meta_page_id, meta_access_token, name, type, primary_offer")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  if (!business.meta_ad_account_id || !business.meta_access_token) {
    return NextResponse.json(
      { error: "Meta ad account not connected. Please connect via Settings." },
      { status: 400 }
    );
  }

  // Check campaign limit
  const { count: campaignCount } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .in("status", ["draft", "active", "paused"]);

  const campaignLimit = PLAN_LIMITS[plan].campaigns;
  if ((campaignCount ?? 0) >= campaignLimit) {
    return NextResponse.json(
      { error: `Campaign limit reached (${campaignLimit}). Upgrade your plan for more.` },
      { status: 403 }
    );
  }

  // Check lead usage
  const usage = await checkUsageLimit(business.id, plan, "leads");
  if (!usage.allowed) {
    return NextResponse.json(
      { error: `Monthly lead limit reached (${usage.limit}). Upgrade to continue.` },
      { status: 403 }
    );
  }

  const body: CreateCampaignBody = await request.json();
  const accessToken = business.meta_access_token;
  const adAccountId = business.meta_ad_account_id;

  // 1. Create campaign in Meta
  const campaignRes = await fetch(
    `https://graph.facebook.com/v21.0/act_${adAccountId}/campaigns`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: body.name,
        objective: "OUTCOME_LEADS",
        status: "PAUSED",
        special_ad_categories: [],
        access_token: accessToken,
      }),
    }
  );

  const campaignData = await campaignRes.json();
  if (!campaignRes.ok) {
    return NextResponse.json(
      { error: campaignData.error?.message ?? "Failed to create Meta campaign" },
      { status: 502 }
    );
  }

  // 2. Create ad set
  const adSetRes = await fetch(
    `https://graph.facebook.com/v21.0/act_${adAccountId}/adsets`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${body.name} - Ad Set`,
        campaign_id: campaignData.id,
        billing_event: "IMPRESSIONS",
        optimization_goal: "LEAD_GENERATION",
        daily_budget: body.daily_budget_cents,
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        status: "PAUSED",
        access_token: accessToken,
      }),
    }
  );

  const adSetData = await adSetRes.json();
  if (!adSetRes.ok) {
    return NextResponse.json(
      { error: adSetData.error?.message ?? "Failed to create ad set" },
      { status: 502 }
    );
  }

  // 3. Create lead form
  const formRes = await fetch(
    `https://graph.facebook.com/v21.0/${business.meta_page_id}/leadgen_forms`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${body.name} Lead Form`,
        questions: [
          { type: "FULL_NAME" },
          { type: "EMAIL" },
          { type: "PHONE_NUMBER" },
        ],
        privacy_policy: {
          url: body.target_url ?? `${process.env.NEXT_PUBLIC_APP_URL}/privacy`,
        },
        access_token: accessToken,
      }),
    }
  );

  const formData = await formRes.json();

  // 4. Save campaign to Supabase
  const { data: campaign, error: insertError } = await supabase
    .from("campaigns")
    .insert({
      business_id: business.id,
      name: body.name,
      meta_campaign_id: campaignData.id,
      meta_adset_id: adSetData.id ?? null,
      meta_form_id: formData.id ?? null,
      status: "draft",
      daily_budget_cents: body.daily_budget_cents,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ campaign });
}
