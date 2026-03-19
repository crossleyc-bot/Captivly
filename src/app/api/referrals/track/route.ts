import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { validateInternalAuth } from "@/lib/internal-auth";

/**
 * POST /api/referrals/track — attribute a lead to a referral link.
 * Called internally after a lead is created with a referral code.
 */
export async function POST(request: NextRequest) {
  const authError = validateInternalAuth(request);
  if (authError) return authError;

  const { lead_id, referral_code } = (await request.json()) as {
    lead_id: string;
    referral_code: string;
  };

  if (!lead_id || !referral_code) {
    return NextResponse.json(
      { error: "lead_id and referral_code required" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Find the referral link
  const { data: link } = await supabase
    .from("referral_links")
    .select("id, business_id, is_active")
    .eq("code", referral_code)
    .single();

  if (!link || !link.is_active) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  // Update the lead with the referral link
  await supabase
    .from("leads")
    .update({ referral_link_id: link.id })
    .eq("id", lead_id);

  // Create or update referral record
  // Check if there's an existing "clicked" referral to upgrade
  const { data: existingReferral } = await supabase
    .from("referrals")
    .select("id")
    .eq("referral_link_id", link.id)
    .eq("status", "clicked")
    .is("referred_lead_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingReferral) {
    // Upgrade existing click to signed_up
    await supabase
      .from("referrals")
      .update({
        referred_lead_id: lead_id,
        status: "signed_up",
      })
      .eq("id", existingReferral.id);
  } else {
    // Create new referral record
    await supabase.from("referrals").insert({
      business_id: link.business_id,
      referral_link_id: link.id,
      referred_lead_id: lead_id,
      status: "signed_up",
    });
  }

  return NextResponse.json({ attributed: true });
}
