import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUsageLimit } from "@/lib/feature-gate";
import { PLAN_LIMITS, TIKTOK_API_BASE_URL } from "@/lib/constants";
import type { PlanTier } from "@/types/database";

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
    .select("id, tiktok_advertiser_id, tiktok_access_token, name, type, primary_offer")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  if (!business.tiktok_advertiser_id || !business.tiktok_access_token) {
    return NextResponse.json(
      { error: "TikTok account not connected. Please connect via Settings." },
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

  const advertiserId = business.tiktok_advertiser_id;
  const accessToken = business.tiktok_access_token;

  const headers = {
    "Access-Token": accessToken,
    "Content-Type": "application/json",
  };

  // TikTok budget is in dollars (float)
  const dailyBudgetDollars = dailyBudgetCents / 100;

  // 1. Create campaign
  const campaignRes = await fetch(`${TIKTOK_API_BASE_URL}/campaign/create/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      advertiser_id: advertiserId,
      campaign_name: name,
      objective_type: "LEAD_GENERATION",
      budget_mode: "BUDGET_MODE_DAY",
      budget: dailyBudgetDollars,
      operation_status: "DISABLE", // Paused
    }),
  });

  const campaignData = await campaignRes.json();
  if (campaignData.code !== 0) {
    console.error("TikTok campaign creation failed:", campaignData);
    return NextResponse.json(
      { error: "Failed to create campaign in TikTok." },
      { status: 502 }
    );
  }

  const tiktokCampaignId = campaignData.data?.campaign_id ?? null;

  // 2. Create Instant Form (lead form)
  const formRes = await fetch(`${TIKTOK_API_BASE_URL}/pages/create/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      advertiser_id: advertiserId,
      page_name: `${name} Lead Form`,
      page_type: "INSTANT_FORM",
      instant_form: {
        banner_type: "DEFAULT",
        greeting: {
          headline: name,
          description: business.primary_offer ?? `Contact ${business.name}`,
        },
        questions: [
          { question_type: "FULL_NAME", required: true },
          { question_type: "EMAIL", required: true },
          { question_type: "PHONE_NUMBER", required: true },
        ],
        privacy_policy_link: `${process.env.NEXT_PUBLIC_APP_URL}/privacy`,
        submit_button_text: "Submit",
        thank_you: {
          headline: "Thank you!",
          description: "We'll be in touch soon.",
        },
      },
    }),
  });

  const formData = await formRes.json();
  const tiktokFormId = formData.data?.page_id ?? null;

  // 3. Save campaign to Supabase
  const { data: campaign, error: insertError } = await supabase
    .from("campaigns")
    .insert({
      business_id: business.id,
      name,
      tiktok_campaign_id: tiktokCampaignId,
      tiktok_form_id: tiktokFormId,
      status: "draft",
      daily_budget_cents: dailyBudgetCents,
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
