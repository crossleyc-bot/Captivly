import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/types/database";
import { BillingActions } from "./billing-actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: dbUser } = await supabase
    .from("users")
    .select("email, full_name, plan_tier, subscription_status, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const plan = (dbUser?.plan_tier ?? "starter") as PlanTier;
  const limits = PLAN_LIMITS[plan];
  const isActive = dbUser?.subscription_status === "active";
  const hasBilling = !!dbUser?.stripe_customer_id;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-zinc-500">
          Manage your account and billing.
        </p>
      </div>

      {/* Account */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="rounded-md border px-4 py-3">
          <p className="text-sm text-zinc-600">
            <span className="font-medium text-zinc-900">{dbUser?.full_name}</span>
            {" — "}
            {dbUser?.email}
          </p>
        </div>
      </section>

      {/* Plan */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Plan</h2>
        <div className="rounded-md border px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold capitalize">{plan} plan</p>
              <p className="text-xs text-zinc-500">
                {isActive ? "Active" : dbUser?.subscription_status ?? "No active subscription"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-zinc-600">
            <div>Leads/month: <span className="font-medium text-zinc-900">{limits.leads_per_month.toLocaleString()}</span></div>
            <div>SMS/month: <span className="font-medium text-zinc-900">{limits.sms_per_month.toLocaleString()}</span></div>
            <div>Campaigns: <span className="font-medium text-zinc-900">{limits.campaigns === Infinity ? "Unlimited" : limits.campaigns}</span></div>
            <div>Sequence steps: <span className="font-medium text-zinc-900">{limits.sequence_steps}</span></div>
          </div>
        </div>
      </section>

      {/* Billing actions */}
      <BillingActions hasBilling={hasBilling} currentPlan={plan} />
    </div>
  );
}
