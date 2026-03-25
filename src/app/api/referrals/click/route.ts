import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { badRequest, notFound } from "@/lib/error-handler";

/**
 * POST /api/referrals/click — record a referral link click.
 * Called from the public landing page when a ?ref=CODE param is present.
 * No auth required (public endpoint).
 */
export async function POST(request: NextRequest) {
  const { code } = (await request.json()) as { code?: string };

  if (!code) {
    return badRequest("code required");
  }

  const supabase = getServiceClient();

  // Find the referral link
  const { data: link } = await supabase
    .from("referral_links")
    .select("id, is_active, business_id")
    .eq("code", code)
    .single();

  if (!link || !link.is_active) {
    return notFound("Invalid referral code");
  }

  // Increment click count
  await supabase.rpc("increment_referral_clicks", {
    p_link_id: link.id,
  });

  // Create a referral record for tracking
  await supabase.from("referrals").insert({
    business_id: link.business_id,
    referral_link_id: link.id,
    status: "clicked",
  });

  return NextResponse.json({ business_id: link.business_id });
}
