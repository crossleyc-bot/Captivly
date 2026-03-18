import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/types/database";

interface Alert {
  type: "warning" | "critical";
  message: string;
}

export async function UsageBanner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  if (!userData) return null;

  const plan = userData.plan_tier as PlanTier;
  const limits = PLAN_LIMITS[plan];

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) return null;

  const month = new Date().toISOString().slice(0, 7);
  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("leads_count, sms_count")
    .eq("business_id", business.id)
    .eq("month", month)
    .single();

  const leadsUsed = usage?.leads_count ?? 0;
  const smsUsed = usage?.sms_count ?? 0;
  const leadsLimit = limits.leads_per_month;
  const smsLimit = limits.sms_per_month;

  const alerts: Alert[] = [];

  // Check leads usage
  if (leadsLimit > 0) {
    const leadsPct = leadsUsed / leadsLimit;
    if (leadsPct >= 1) {
      alerts.push({
        type: "critical",
        message: `You've hit your lead limit (${leadsUsed.toLocaleString()}/${leadsLimit.toLocaleString()}). New leads are being dropped.`,
      });
    } else if (leadsPct >= 0.8) {
      alerts.push({
        type: "warning",
        message: `You've used ${leadsUsed.toLocaleString()} of ${leadsLimit.toLocaleString()} leads this month.`,
      });
    }
  }

  // Check SMS usage (skip if plan has 0 SMS)
  if (smsLimit > 0) {
    const smsPct = smsUsed / smsLimit;
    if (smsPct >= 1) {
      alerts.push({
        type: "critical",
        message: `You've hit your SMS limit (${smsUsed.toLocaleString()}/${smsLimit.toLocaleString()}). SMS messages will not be sent.`,
      });
    } else if (smsPct >= 0.8) {
      alerts.push({
        type: "warning",
        message: `You've used ${smsUsed.toLocaleString()} of ${smsLimit.toLocaleString()} SMS messages this month.`,
      });
    }
  }

  if (alerts.length === 0) return null;

  // Show the most severe alert first
  const hasCritical = alerts.some((a) => a.type === "critical");
  const bgClass = hasCritical
    ? "bg-red-50 border-red-200 text-red-800"
    : "bg-amber-50 border-amber-200 text-amber-800";
  const linkClass = hasCritical
    ? "font-semibold text-red-900 underline hover:text-red-700"
    : "font-semibold text-amber-900 underline hover:text-amber-700";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${bgClass}`}>
      <div className="flex flex-col gap-1">
        {alerts.map((alert) => (
          <p key={alert.message}>{alert.message}</p>
        ))}
      </div>
      {plan !== "pro" && (
        <p className="mt-1">
          <Link href="/settings" className={linkClass}>
            Upgrade your plan
          </Link>{" "}
          for higher limits.
        </p>
      )}
    </div>
  );
}
