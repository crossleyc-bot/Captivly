import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUsageLimit } from "@/lib/feature-gate";
import { PLAN_LIMITS, LINKEDIN_API_BASE_URL } from "@/lib/constants";
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
    .select("id, linkedin_ad_account_id, linkedin_access_token, name, type, primary_offer")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  if (!business.linkedin_ad_account_id || !business.linkedin_access_token) {
    return NextResponse.json(
      { error: "LinkedIn account not connected. Please connect via Settings." },
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

  const adAccountId = business.linkedin_ad_account_id;
  const accessToken = business.linkedin_access_token;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "LinkedIn-Version": "202401",
    "X-Restli-Protocol-Version": "2.0.0",
  };

  // LinkedIn daily budget in cents (they use amount in the currency's minor unit)
  const dailyBudgetValue = (dailyBudgetCents / 100).toFixed(2);

  // 1. Create campaign group (LinkedIn equivalent of a campaign container)
  const groupRes = await fetch(`${LINKEDIN_API_BASE_URL}/adCampaignGroups`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      account: `urn:li:sponsoredAccount:${adAccountId}`,
      name,
      status: "DRAFT",
      runSchedule: { start: new Date().toISOString().split("T")[0] },
      totalBudget: { currencyCode: "USD", amount: "0" },
    }),
  });

  const groupData = await groupRes.json();
  if (!groupRes.ok) {
    console.error("LinkedIn campaign group creation failed:", groupData);
    return NextResponse.json(
      { error: "Failed to create campaign group in LinkedIn." },
      { status: 502 }
    );
  }

  // Extract campaign group ID from the response header or body
  const groupId = groupRes.headers.get("x-restli-id") ?? groupData.id ?? null;

  // 2. Create campaign (ad campaign within the group)
  const campaignRes = await fetch(`${LINKEDIN_API_BASE_URL}/adCampaigns`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      account: `urn:li:sponsoredAccount:${adAccountId}`,
      campaignGroup: groupId ? `urn:li:sponsoredCampaignGroup:${groupId}` : undefined,
      name: `${name} - Lead Gen`,
      status: "DRAFT",
      type: "SPONSORED_UPDATES",
      objectiveType: "LEAD_GENERATION",
      costType: "CPM",
      dailyBudget: { currencyCode: "USD", amount: dailyBudgetValue },
      runSchedule: { start: new Date().toISOString().split("T")[0] },
    }),
  });

  const campaignData = await campaignRes.json();
  if (!campaignRes.ok) {
    console.error("LinkedIn campaign creation failed:", campaignData);
    return NextResponse.json(
      { error: "Failed to create campaign in LinkedIn." },
      { status: 502 }
    );
  }

  const linkedinCampaignId =
    campaignRes.headers.get("x-restli-id") ?? campaignData.id ?? null;

  // 3. Create Lead Gen Form
  const formRes = await fetch(`${LINKEDIN_API_BASE_URL}/leadGenForms`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      account: `urn:li:sponsoredAccount:${adAccountId}`,
      name: `${name} Lead Form`,
      headline: name,
      description: business.primary_offer ?? `Learn more about ${business.name}`,
      callToAction: "LEARN_MORE",
      questions: [
        { predefinedField: "FIRST_NAME", required: true },
        { predefinedField: "LAST_NAME", required: true },
        { predefinedField: "EMAIL", required: true },
        { predefinedField: "PHONE_NUMBER", required: true },
      ],
      privacyPolicyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/privacy`,
      thankYouMessage: {
        message: "Thank you for your interest! We'll be in touch soon.",
      },
    }),
  });

  const formData = await formRes.json();
  const linkedinFormId =
    formRes.headers.get("x-restli-id") ?? formData.id ?? null;

  // 4. Save campaign to Supabase
  const { data: campaign, error: insertError } = await supabase
    .from("campaigns")
    .insert({
      business_id: business.id,
      name,
      linkedin_campaign_id: linkedinCampaignId ? String(linkedinCampaignId) : null,
      linkedin_form_id: linkedinFormId ? String(linkedinFormId) : null,
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
