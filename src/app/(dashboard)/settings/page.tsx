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

  // Fetch business + current month usage
  const { data: business } = await supabase
    .from("businesses")
    .select("id, meta_ad_account_id, google_customer_id, tiktok_advertiser_id, linkedin_ad_account_id")
    .eq("user_id", user.id)
    .single();

  const month = new Date().toISOString().slice(0, 7);
  const { data: usage } = business
    ? await supabase
        .from("usage_tracking")
        .select("leads_count, sms_count, emails_count")
        .eq("business_id", business.id)
        .eq("month", month)
        .single()
    : { data: null };

  const leadsUsed = usage?.leads_count ?? 0;
  const smsUsed = usage?.sms_count ?? 0;
  const emailsUsed = usage?.emails_count ?? 0;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-slate-500">
          Manage your account and billing.
        </p>
      </div>

      {/* Account */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="rounded-md border px-4 py-3">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{dbUser?.full_name}</span>
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
              <p className="text-xs text-slate-500">
                {isActive ? "Active" : dbUser?.subscription_status ?? "No active subscription"}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Leads", used: leadsUsed, limit: limits.leads_per_month },
              { label: "SMS", used: smsUsed, limit: limits.sms_per_month },
              { label: "Emails", used: emailsUsed, limit: Infinity },
            ].map(({ label, used, limit }) => {
              const pct = limit === Infinity || limit === 0 ? 0 : Math.min((used / limit) * 100, 100);
              const isNear = pct >= 80;
              return (
                <div key={label} className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{label}</span>
                    <span className={isNear ? "font-medium text-red-600" : "text-slate-500"}>
                      {used.toLocaleString()} / {limit === Infinity ? "∞" : limit.toLocaleString()}
                    </span>
                  </div>
                  {limit !== Infinity && limit > 0 && (
                    <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                      <div
                        className={`h-1.5 rounded-full ${isNear ? "bg-red-500" : "bg-blue-600"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm text-slate-600">
              <div>Campaigns: <span className="font-medium text-slate-900">{limits.campaigns === Infinity ? "Unlimited" : limits.campaigns}</span></div>
              <div>Sequence steps: <span className="font-medium text-slate-900">{limits.sequence_steps}</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Connected accounts */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Connected Accounts</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Meta (Facebook/Instagram)</p>
              <p className="text-xs text-slate-500">
                {business?.meta_ad_account_id
                  ? `Connected — Account ${business.meta_ad_account_id}`
                  : "Not connected"}
              </p>
            </div>
            {!business?.meta_ad_account_id && (
              <a
                href="/api/meta/auth"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Connect
              </a>
            )}
          </div>
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Google Ads</p>
              <p className="text-xs text-slate-500">
                {business?.google_customer_id
                  ? `Connected — Customer ${business.google_customer_id}`
                  : "Not connected"}
              </p>
            </div>
            {!business?.google_customer_id && (
              <a
                href="/api/google/auth"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Connect
              </a>
            )}
          </div>
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">TikTok</p>
              <p className="text-xs text-slate-500">
                {business?.tiktok_advertiser_id
                  ? `Connected — Advertiser ${business.tiktok_advertiser_id}`
                  : "Not connected"}
              </p>
            </div>
            {!business?.tiktok_advertiser_id && (
              <a
                href="/api/tiktok/auth"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Connect
              </a>
            )}
          </div>
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">LinkedIn</p>
              <p className="text-xs text-slate-500">
                {business?.linkedin_ad_account_id
                  ? `Connected — Account ${business.linkedin_ad_account_id}`
                  : "Not connected"}
              </p>
            </div>
            {!business?.linkedin_ad_account_id && (
              <a
                href="/api/linkedin/auth"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Connect
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Billing actions */}
      <BillingActions hasBilling={hasBilling} currentPlan={plan} />

      {/* Support */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Need Help?</h2>
        <div className="rounded-lg border px-4 py-3">
          <p className="text-sm text-slate-600">
            Having an issue or need assistance?{" "}
            <a href="/support" className="text-blue-600 hover:text-blue-700 hover:underline">
              Submit a support ticket
            </a>{" "}
            and our team will get back to you.
          </p>
        </div>
      </section>
    </div>
  );
}
