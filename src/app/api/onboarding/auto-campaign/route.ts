import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInternalAuthHeader } from "@/lib/internal-auth";
import { unauthorized, notFound, internalError } from "@/lib/error-handler";

/**
 * POST /api/onboarding/auto-campaign
 *
 * Called after onboarding completes. Creates a draft campaign and
 * triggers AI sequence generation so the user has a ready-to-activate
 * campaign when they first visit the dashboard.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, type, primary_offer")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return notFound("No business found");
  }

  // Check if a campaign already exists (avoid duplicates on retry)
  const { count: existingCount } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  if ((existingCount ?? 0) > 0) {
    return NextResponse.json({ skipped: true, reason: "Campaign already exists" });
  }

  // Create a draft campaign
  const campaignName = `${business.primary_offer ?? business.name} — Starter Campaign`;

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      business_id: business.id,
      name: campaignName,
      status: "draft",
    })
    .select()
    .single();

  if (campaignError || !campaign) {
    return internalError(campaignError?.message ?? "Failed to create campaign");
  }

  // Trigger AI sequence generation for this campaign
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/sequences/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getInternalAuthHeader(),
        },
        body: JSON.stringify({
          campaign_id: campaign.id,
          business_id: business.id,
        }),
      }
    );
  } catch {
    // Sequence generation failure shouldn't fail the whole onboarding
  }

  return NextResponse.json({ campaign_id: campaign.id });
}
