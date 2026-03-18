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

  const raw = await request.json();

  // Validate input
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name || name.length > 100) {
    return NextResponse.json(
      { error: "Campaign name is required and must be under 100 characters" },
      { status: 400 }
    );
  }

  const dailyBudgetCents = Number(raw.daily_budget_cents);
  if (
    !Number.isInteger(dailyBudgetCents) ||
    dailyBudgetCents < 100 ||
    dailyBudgetCents > 1_000_000
  ) {
    return NextResponse.json(
      { error: "Daily budget must be between $1.00 and $10,000.00" },
      { status: 400 }
    );
  }

  let targetUrl: string | undefined;
  if (raw.target_url !== undefined) {
    try {
      const parsed = new URL(String(raw.target_url));
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol");
      }
      targetUrl = parsed.toString();
    } catch {
      return NextResponse.json(
        { error: "target_url must be a valid HTTP(S) URL" },
        { status: 400 }
      );
    }
  }

  const body: CreateCampaignBody = {
    name,
    daily_budget_cents: dailyBudgetCents,
    target_url: targetUrl,
  };
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
    console.error("Meta campaign creation failed:", campaignData.error);
    return NextResponse.json(
      { error: "Failed to create campaign. Please try again." },
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
    console.error("Meta ad set creation failed:", adSetData.error);
    return NextResponse.json(
      { error: "Failed to create ad set. Please try again." },
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
    console.error("Campaign insert failed:", insertError.message);
    return NextResponse.json(
      { error: "Failed to save campaign. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ campaign });
}
