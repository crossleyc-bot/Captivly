import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { unauthorized, notFound, internalError } from "@/lib/error-handler";

/**
 * GET /api/referrals — list referral links for the current business
 * POST /api/referrals — create a new referral link
 */

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return notFound("No business found");
  }

  const { data: links } = await supabase
    .from("referral_links")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ links: links ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return notFound("No business found");
  }

  const body = (await request.json()) as {
    lead_id?: string;
    referrer_name?: string;
    referrer_email?: string;
  };

  // Generate a short unique referral code
  const code = randomBytes(6).toString("base64url");

  const { data: link, error } = await supabase
    .from("referral_links")
    .insert({
      business_id: business.id,
      lead_id: body.lead_id ?? null,
      code,
      referrer_name: body.referrer_name ?? null,
      referrer_email: body.referrer_email ?? null,
    })
    .select()
    .single();

  if (error) {
    return internalError(error.message);
  }

  return NextResponse.json({ link });
}
