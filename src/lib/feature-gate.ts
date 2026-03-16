import type { PlanTier } from "@/types/database";
import { PLAN_LIMITS, PLAN_HIERARCHY } from "./constants";
import { createClient } from "./supabase/server";

export function requirePlan(userPlan: PlanTier, requiredPlan: PlanTier): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

export async function checkUsageLimit(
  businessId: string,
  plan: PlanTier,
  type: "leads" | "sms"
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = await createClient();
  const month = new Date().toISOString().slice(0, 7);

  const { data } = await supabase
    .from("usage_tracking")
    .select("leads_count, sms_count")
    .eq("business_id", businessId)
    .eq("month", month)
    .single();

  const current = type === "leads" ? (data?.leads_count ?? 0) : (data?.sms_count ?? 0);
  const limit =
    type === "leads" ? PLAN_LIMITS[plan].leads_per_month : PLAN_LIMITS[plan].sms_per_month;

  return { allowed: current < limit, current, limit };
}
