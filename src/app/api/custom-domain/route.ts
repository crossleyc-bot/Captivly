import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePlan } from "@/lib/feature-gate";
import { randomBytes } from "crypto";
import type { PlanTier } from "@/types/database";
import { unauthorized, forbidden, notFound, badRequest, internalError } from "@/lib/error-handler";

/**
 * GET /api/custom-domain — get custom domain config
 * POST /api/custom-domain — register a custom domain
 * DELETE /api/custom-domain — remove a custom domain
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

  const { data: domain } = await supabase
    .from("custom_domains")
    .select("*")
    .eq("business_id", business.id)
    .single();

  return NextResponse.json({ domain });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  if (!requirePlan((dbUser?.plan_tier ?? "starter") as PlanTier, "pro")) {
    return forbidden("Custom domains require the Pro plan");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return notFound("No business found");
  }

  const { domain } = (await request.json()) as { domain: string };

  if (!domain?.trim()) {
    return badRequest("Domain is required");
  }

  // Basic domain validation
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

  if (!domainRegex.test(cleanDomain)) {
    return badRequest("Invalid domain format");
  }

  // Generate verification token
  const verificationToken = `captivly-verify-${randomBytes(16).toString("hex")}`;

  // Check for existing domain
  const { data: existing } = await supabase
    .from("custom_domains")
    .select("id")
    .eq("business_id", business.id)
    .single();

  if (existing) {
    // Update existing
    const { data: updated, error } = await supabase
      .from("custom_domains")
      .update({
        domain: cleanDomain,
        verification_token: verificationToken,
        verified: false,
        verified_at: null,
        ssl_provisioned: false,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return internalError(error.message);
    }

    return NextResponse.json({ domain: updated });
  }

  const { data: created, error } = await supabase
    .from("custom_domains")
    .insert({
      business_id: business.id,
      domain: cleanDomain,
      verification_token: verificationToken,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This domain is already registered" },
        { status: 409 }
      );
    }
    return internalError(error.message);
  }

  return NextResponse.json({ domain: created });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  if (!requirePlan((dbUser?.plan_tier ?? "starter") as PlanTier, "pro")) {
    return forbidden("Custom domains require the Pro plan");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return notFound("No business found");
  }

  await supabase
    .from("custom_domains")
    .delete()
    .eq("business_id", business.id);

  // Also clear from white_label_config
  await supabase
    .from("white_label_config")
    .update({ custom_domain: null, custom_domain_verified: false })
    .eq("business_id", business.id);

  return NextResponse.json({ removed: true });
}
