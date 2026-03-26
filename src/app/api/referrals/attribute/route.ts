import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { badRequest, unauthorized, notFound } from "@/lib/error-handler";

/**
 * POST /api/referrals/attribute — attribute the current authenticated user to a referral code.
 * Called from the client after successful signup when a ref param was present.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { referral_code } = (await request.json()) as { referral_code?: string };

  if (!referral_code) {
    return badRequest("referral_code is required");
  }

  const serviceClient = getServiceClient();

  // Find the referral link
  const { data: link } = await serviceClient
    .from("referral_links")
    .select("id, business_id, is_active")
    .eq("code", referral_code)
    .single();

  if (!link || !link.is_active) {
    return notFound("Invalid referral code");
  }

  // Update or create referral record: upgrade a "clicked" to "signed_up"
  const { data: existingReferral } = await serviceClient
    .from("referrals")
    .select("id")
    .eq("referral_link_id", link.id)
    .eq("status", "clicked")
    .is("referred_lead_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingReferral) {
    await serviceClient
      .from("referrals")
      .update({
        referred_user_id: user.id,
        status: "signed_up",
      })
      .eq("id", existingReferral.id);
  } else {
    await serviceClient.from("referrals").insert({
      business_id: link.business_id,
      referral_link_id: link.id,
      referred_user_id: user.id,
      status: "signed_up",
    });
  }

  return NextResponse.json({ attributed: true });
}
