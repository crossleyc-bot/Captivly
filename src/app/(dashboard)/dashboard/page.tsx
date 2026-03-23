import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { scoreColor, leadStatusBadge, formatCents } from "@/lib/ui-utils";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: business }, { data: userRow }] = await Promise.all([
    supabase.from("businesses").select("id").eq("user_id", user.id).single(),
    supabase.from("users").select("plan_tier").eq("id", user.id).single(),
  ]);

  if (!business) redirect("/onboarding");

  const plan = (userRow?.plan_tier ?? "starter") as PlanTier;
  const limits = PLAN_LIMITS[plan];

  const month = new Date().toISOString().slice(0, 7);

  // Fetch stats in parallel
  const [leadsResult, campaignsResult, conversionsResult, usageResult, recentLeadsResult, dealsResult, pipelineStagesResult] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id),
      supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .in("status", ["active", "draft", "paused"]),
      supabase
        .from("conversions")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id),
      supabase
        .from("usage_tracking")
        .select("leads_count, sms_count, emails_count")
        .eq("business_id", business.id)
        .eq("month", month)
        .single(),
      supabase
        .from("leads")
        .select("id, first_name, last_name, email, ai_score, status, created_at")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("deals")
        .select("id, value_cents, stage_id")
        .eq("business_id", business.id),
      supabase
        .from("pipeline_stages")
        .select("id, is_won, is_lost")
        .eq("business_id", business.id),
    ]);

  const totalLeads = leadsResult.count ?? 0;
  const activeCampaigns = campaignsResult.count ?? 0;
  const totalConversions = conversionsResult.count ?? 0;
  const usage = usageResult.data;
  const recentLeads = recentLeadsResult.data ?? [];
  const allDeals = dealsResult.data ?? [];
  const pipelineStages = pipelineStagesResult.data ?? [];

  const wonStageIds = new Set(pipelineStages.filter((s) => s.is_won).map((s) => s.id));
  const lostStageIds = new Set(pipelineStages.filter((s) => s.is_lost).map((s) => s.id));
  const openDeals = allDeals.filter((d) => d.stage_id && !wonStageIds.has(d.stage_id) && !lostStageIds.has(d.stage_id));
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value_cents ?? 0), 0);

  const leadsUsed = usage?.leads_count ?? 0;
  const smsUsed = usage?.sms_count ?? 0;
  const leadsPercent = limits.leads_per_month > 0 ? Math.round((leadsUsed / limits.leads_per_month) * 100) : 0;
  const smsPercent = limits.sms_per_month > 0 ? Math.round((smsUsed / limits.sms_per_month) * 100) : 0;
  const nearLeadLimit = leadsPercent >= 80;
  const atLeadLimit = leadsUsed >= limits.leads_per_month;
  const nearSmsLimit = limits.sms_per_month > 0 && smsPercent >= 80;
  const atSmsLimit = limits.sms_per_month > 0 && smsUsed >= limits.sms_per_month;

  const stats = [
    { label: "Total Leads", value: totalLeads.toLocaleString(), accent: "bg-indigo-500" },
    { label: "Active Campaigns", value: activeCampaigns.toLocaleString(), accent: "bg-blue-500" },
    { label: "Conversions", value: totalConversions.toLocaleString(), accent: "bg-emerald-500" },
    { label: "Open Deals", value: openDeals.length.toLocaleString(), accent: "bg-violet-500" },
    { label: "Pipeline Value", value: formatCents(pipelineValue), accent: "bg-amber-500" },
  ];


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your leads, campaigns, and outreach performance.
        </p>
      </div>

      {/* Usage limit banners */}
      {(atLeadLimit || atSmsLimit) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">
            {atLeadLimit && atSmsLimit
              ? "You've reached your lead and SMS limits for this month."
              : atLeadLimit
                ? "You've reached your lead limit for this month."
                : "You've reached your SMS limit for this month."}
          </p>
          <p className="mt-1 text-sm text-red-600">
            New {atLeadLimit ? "leads" : "SMS messages"} will be blocked until next month.{" "}
            {plan !== "pro" && (
              <Link href="/settings" className="font-medium underline">
                Upgrade your plan
              </Link>
            )}
          </p>
        </div>
      )}
      {!atLeadLimit && !atSmsLimit && (nearLeadLimit || nearSmsLimit) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            {nearLeadLimit && nearSmsLimit
              ? "You're approaching your lead and SMS limits."
              : nearLeadLimit
                ? `You've used ${leadsPercent}% of your monthly lead limit.`
                : `You've used ${smsPercent}% of your monthly SMS limit.`}
          </p>
          {plan !== "pro" && (
            <p className="mt-1 text-sm text-amber-600">
              <Link href="/settings" className="font-medium underline">
                Upgrade your plan
              </Link>
              {" "}for higher limits.
            </p>
          )}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="overflow-hidden rounded-lg border px-4 py-3"
          >
            <div className={`-mx-4 -mt-3 mb-3 h-1 ${stat.accent}`} />
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Usage this month */}
      <div>
        <h2 className="text-lg font-semibold">Usage This Month</h2>
        <p className="mt-1 text-sm text-slate-500">
          {plan.charAt(0).toUpperCase() + plan.slice(1)} plan
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Leads</span>
              <span className="font-medium">
                {leadsUsed.toLocaleString()} / {limits.leads_per_month.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${atLeadLimit ? "bg-red-500" : nearLeadLimit ? "bg-amber-500" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(leadsPercent, 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">SMS</span>
              <span className="font-medium">
                {limits.sms_per_month === 0
                  ? "Not included"
                  : `${smsUsed.toLocaleString()} / ${limits.sms_per_month.toLocaleString()}`}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${atSmsLimit ? "bg-red-500" : nearSmsLimit ? "bg-amber-500" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(smsPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent leads */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Leads</h2>
          <Link href="/leads" className="text-sm text-slate-500 hover:text-slate-900">
            View all
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">No leads yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Leads will appear here once your campaigns start running.
            </p>
            <Link
              href="/campaigns/new"
              className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create your first campaign
            </Link>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-slate-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {lead.first_name ?? "Unknown"} {lead.last_name ?? ""}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {lead.email ?? "—"}
                    </td>
                    <td className={`py-2 pr-4 font-semibold ${scoreColor(lead.ai_score)}`}>
                      {lead.ai_score ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${leadStatusBadge(lead.status)}`}
                      >
                        {lead.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2 text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
