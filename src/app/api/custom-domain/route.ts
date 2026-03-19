import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePlan } from "@/lib/feature-gate";
import { randomBytes } from "crypto";
import type { PlanTier } from "@/types/database";

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  if (!requirePlan((dbUser?.plan_tier ?? "starter") as PlanTier, "pro")) {
    return NextResponse.json(
      { error: "Custom domains require the Pro plan" },
      { status: 403 }
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const { domain } = (await request.json()) as { domain: string };

  if (!domain?.trim()) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  // Basic domain validation
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

  if (!domainRegex.test(cleanDomain)) {
    return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
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
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ domain: created });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
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
