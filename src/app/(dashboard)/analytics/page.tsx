import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLAN_LIMITS } from "@/lib/constants";
import { formatCents } from "@/lib/ui-utils";
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

  const [usageResult, leadsResult, conversionsResult, dealsResult, stagesResult] = await Promise.all([
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
    supabase
      .from("deals")
      .select("id, value_cents, stage_id, closed_at, created_at")
      .eq("business_id", business.id),
    supabase
      .from("pipeline_stages")
      .select("id, name, color, is_won, is_lost")
      .eq("business_id", business.id)
      .order("position", { ascending: true }),
  ]);

  const usage = usageResult.data;
  const leads = leadsResult.data ?? [];
  const totalConversions = conversionsResult.count ?? 0;
  const allDeals = dealsResult.data ?? [];
  const pipelineStages = stagesResult.data ?? [];

  // Pipeline analytics
  const wonStageIds = new Set(pipelineStages.filter((s) => s.is_won).map((s) => s.id));
  const lostStageIds = new Set(pipelineStages.filter((s) => s.is_lost).map((s) => s.id));
  const openDeals = allDeals.filter((d) => d.stage_id && !wonStageIds.has(d.stage_id) && !lostStageIds.has(d.stage_id));
  const wonDeals = allDeals.filter((d) => d.stage_id && wonStageIds.has(d.stage_id));
  const lostDeals = allDeals.filter((d) => d.stage_id && lostStageIds.has(d.stage_id));
  const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.value_cents ?? 0), 0);
  const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.value_cents ?? 0), 0);
  const winRate = wonDeals.length + lostDeals.length > 0
    ? ((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100).toFixed(1)
    : "—";

  // Deals per stage
  const dealsByStage: Record<string, number> = {};
  for (const deal of allDeals) {
    if (deal.stage_id) {
      dealsByStage[deal.stage_id] = (dealsByStage[deal.stage_id] ?? 0) + 1;
    }
  }

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
            className={`h-2 rounded-full ${isNearLimit ? "bg-red-500" : "bg-indigo-600"}`}
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

      {/* Pipeline metrics */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pipeline Overview</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Open Deals</p>
            <p className="mt-1 text-2xl font-bold">{openDeals.length}</p>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Pipeline Value</p>
            <p className="mt-1 text-2xl font-bold">{formatCents(totalPipelineValue)}</p>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Won Value</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{formatCents(totalWonValue)}</p>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Win Rate</p>
            <p className="mt-1 text-2xl font-bold">{winRate}{winRate !== "—" ? "%" : ""}</p>
          </div>
        </div>
      </section>

      {/* Deals by stage */}
      {pipelineStages.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Deals by Stage</h2>
          <div className="rounded-lg border p-4">
            <div className="space-y-2">
              {pipelineStages.map((stage) => {
                const count = dealsByStage[stage.id] ?? 0;
                const maxCount = Math.max(...Object.values(dealsByStage), 1);
                const pct = (count / maxCount) * 100;

                return (
                  <div key={stage.id} className="flex items-center gap-3 text-sm">
                    <div className="flex w-32 items-center gap-1.5 shrink-0">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="truncate text-slate-700">{stage.name}</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 rounded-full bg-slate-100">
                        <div
                          className="h-4 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: stage.color,
                            minWidth: count > 0 ? "8px" : "0",
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-right font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
