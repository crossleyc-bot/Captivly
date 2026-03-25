import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePlan } from "@/lib/feature-gate";
import type { PlanTier } from "@/types/database";
import { unauthorized, forbidden, notFound, badRequest } from "@/lib/error-handler";

/**
 * POST /api/custom-domain/ssl — request SSL provisioning for a verified domain
 */
export async function POST() {
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

  const { data: domainRecord } = await supabase
    .from("custom_domains")
    .select("*")
    .eq("business_id", business.id)
    .single();

  if (!domainRecord) {
    return notFound("No domain configured");
  }

  if (!domainRecord.verified) {
    return badRequest("Domain must be verified before SSL can be provisioned");
  }

  if (domainRecord.ssl_provisioned) {
    return NextResponse.json({ ssl_provisioned: true, already_provisioned: true });
  }

  // Mark SSL as provisioned (in production, this would trigger a cert provider)
  await supabase
    .from("custom_domains")
    .update({ ssl_provisioned: true })
    .eq("id", domainRecord.id);

  return NextResponse.json({ ssl_provisioned: true });
}
