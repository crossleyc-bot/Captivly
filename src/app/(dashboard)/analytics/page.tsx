import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/types/database";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: dbUser } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const plan = (dbUser?.plan_tier ?? "starter") as PlanTier;
  const limits = PLAN_LIMITS[plan];

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  const month = new Date().toISOString().slice(0, 7);

  const [usageResult, leadsResult, conversionsResult] = await Promise.all([
    supabase
      .from("usage_tracking")
      .select("leads_count, sms_count, emails_count")
      .eq("business_id", business.id)
      .eq("month", month)
      .single(),
    supabase
      .from("leads")
      .select("ai_score, status")
      .eq("business_id", business.id),
    supabase
      .from("conversions")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
  ]);

  const usage = usageResult.data;
  const leads = leadsResult.data ?? [];
  const totalConversions = conversionsResult.count ?? 0;

  // Compute lead stats
  const avgScore =
    leads.length > 0
      ? (
          leads.reduce((sum, l) => sum + (l.ai_score ?? 0), 0) /
          leads.filter((l) => l.ai_score !== null).length
        ).toFixed(1)
      : "—";

  const statusCounts: Record<string, number> = {};
  for (const lead of leads) {
    statusCounts[lead.status] = (statusCounts[lead.status] ?? 0) + 1;
  }

  const conversionRate =
    leads.length > 0 ? ((totalConversions / leads.length) * 100).toFixed(1) : "0";

  const usageBar = (current: number, limit: number, label: string) => {
    const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
    const isNearLimit = pct >= 80;
    return (
      <div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">{label}</span>
          <span className={isNearLimit ? "font-medium text-red-600" : "text-slate-600"}>
            {current.toLocaleString()} / {limit === Infinity ? "∞" : limit.toLocaleString()}
          </span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-slate-100">
          <div
            className={`h-2 rounded-full ${isNearLimit ? "bg-red-500" : "bg-teal-600"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Performance overview for {new Date().toLocaleString("default", { month: "long", year: "numeric" })}.
        </p>
      </div>

      {/* Usage meters */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Usage This Month</h2>
        <div className="space-y-4 rounded-lg border p-4">
          {usageBar(usage?.leads_count ?? 0, limits.leads_per_month, "Leads")}
          {usageBar(usage?.sms_count ?? 0, limits.sms_per_month, "SMS")}
          {usageBar(usage?.emails_count ?? 0, Infinity, "Emails")}
        </div>
      </section>

      {/* Key metrics */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Key Metrics</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Total Leads</p>
            <p className="mt-1 text-2xl font-bold">{leads.length}</p>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Avg AI Score</p>
            <p className="mt-1 text-2xl font-bold">{avgScore}</p>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Conversions</p>
            <p className="mt-1 text-2xl font-bold">{totalConversions}</p>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Conv. Rate</p>
            <p className="mt-1 text-2xl font-bold">{conversionRate}%</p>
          </div>
        </div>
      </section>

      {/* Lead status breakdown */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Lead Status Breakdown</h2>
        <div className="rounded-lg border p-4">
          {Object.keys(statusCounts).length === 0 ? (
            <p className="text-sm text-slate-400">No leads yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(statusCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-700">{status.replace("_", " ")}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
