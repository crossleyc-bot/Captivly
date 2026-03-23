import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUsageLimit } from "@/lib/feature-gate";
import { PLAN_LIMITS, GOOGLE_ADS_API_BASE_URL } from "@/lib/constants";
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
    .select("id, google_customer_id, google_access_token, name, type, primary_offer")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  if (!business.google_customer_id || !business.google_access_token) {
    return NextResponse.json(
      { error: "Google Ads account not connected. Please connect via Settings." },
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

  const customerId = business.google_customer_id;
  const accessToken = business.google_access_token;
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;
  const apiBase = `${GOOGLE_ADS_API_BASE_URL}/customers/${customerId}`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": devToken,
    "Content-Type": "application/json",
  };

  // Daily budget in micros (Google Ads uses micros = cents * 10_000)
  const dailyBudgetMicros = dailyBudgetCents * 10_000;

  // 1. Create a campaign budget
  const budgetRes = await fetch(`${apiBase}/campaignBudgets:mutate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      operations: [
        {
          create: {
            name: `${name} Budget`,
            amountMicros: String(dailyBudgetMicros),
            deliveryMethod: "STANDARD",
          },
        },
      ],
    }),
  });

  const budgetData = await budgetRes.json();
  if (!budgetRes.ok) {
    console.error("Google Ads budget creation failed:", budgetData);
    return NextResponse.json(
      { error: "Failed to create campaign budget in Google Ads." },
      { status: 502 }
    );
  }

  const budgetResourceName = budgetData.results?.[0]?.resourceName;

  // 2. Create campaign
  const campaignRes = await fetch(`${apiBase}/campaigns:mutate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      operations: [
        {
          create: {
            name,
            advertisingChannelType: "SEARCH",
            status: "PAUSED",
            campaignBudget: budgetResourceName,
            biddingStrategyType: "MAXIMIZE_CONVERSIONS",
          },
        },
      ],
    }),
  });

  const campaignData = await campaignRes.json();
  if (!campaignRes.ok) {
    console.error("Google Ads campaign creation failed:", campaignData);
    return NextResponse.json(
      { error: "Failed to create campaign in Google Ads." },
      { status: 502 }
    );
  }

  const googleCampaignResource = campaignData.results?.[0]?.resourceName;
  // Extract campaign ID from resource name like "customers/123/campaigns/456"
  const googleCampaignId = googleCampaignResource?.split("/").pop() ?? null;

  // 3. Create lead form asset
  const formRes = await fetch(`${apiBase}/assets:mutate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      operations: [
        {
          create: {
            name: `${name} Lead Form`,
            type: "LEAD_FORM",
            leadFormAsset: {
              callToActionType: "LEARN_MORE",
              callToActionDescription: business.primary_offer ?? "Learn more",
              businessName: business.name,
              headline: name,
              description: business.primary_offer ?? `Contact ${business.name}`,
              fields: [
                { inputType: "FULL_NAME" },
                { inputType: "EMAIL" },
                { inputType: "PHONE_NUMBER" },
              ],
              deliveryMethods: [{ webhookDelivery: {} }],
            },
          },
        },
      ],
    }),
  });

  const formData = await formRes.json();
  const formResourceName = formData.results?.[0]?.resourceName;
  const googleFormId = formResourceName?.split("/").pop() ?? null;

  // 4. Save campaign to Supabase
  const { data: campaign, error: insertError } = await supabase
    .from("campaigns")
    .insert({
      business_id: business.id,
      name,
      google_campaign_id: googleCampaignId,
      google_form_id: googleFormId,
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
