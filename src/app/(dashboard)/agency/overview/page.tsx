import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requirePlan } from "@/lib/feature-gate";
import { scoreColor, campaignStatusBadge } from "@/lib/ui-utils";
import type { PlanTier } from "@/types/database";
import Link from "next/link";

interface ClientStats {
  id: string;
  name: string;
  type: string;
  location_city: string | null;
  location_state: string | null;
  leads_this_month: number;
  conversions_this_month: number;
  conversion_rate: number;
  avg_ai_score: number | null;
  messages_sent: number;
}

export default async function AgencyOverviewPage() {
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

  if (!requirePlan(plan, "pro")) {
    redirect("/agency");
  }

  // Resolve agency
  let agency: { id: string; name: string } | null = null;

  const { data: ownedAgency } = await supabase
    .from("agencies")
    .select("id, name")
    .eq("owner_user_id", user.id)
    .single();

  if (ownedAgency) {
    agency = ownedAgency;
  } else {
    const { data: membership } = await supabase
      .from("agency_members")
      .select("agency:agencies(id, name)")
      .eq("user_id", user.id)
      .single();

    if (membership?.agency) {
      agency = membership.agency as unknown as { id: string; name: string };
    }
  }

  if (!agency) {
    redirect("/agency");
  }

  // Fetch all businesses in the agency
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, type, location_city, location_state")
    .eq("agency_id", agency.id);

  const businessIds = (businesses ?? []).map((b) => b.id);

  // Fetch member count
  const { count: memberCount } = await supabase
    .from("agency_members")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agency.id);

  if (businessIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{agency.name}</h1>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Agency Overview
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {memberCount ?? 0} team members / 0 clients
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-600">No client accounts yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Add client businesses to your agency to see aggregate analytics here.
          </p>
          <Link
            href="/agency"
            className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Manage Clients
          </Link>
        </div>
      </div>
    );
  }

  const month = new Date().toISOString().slice(0, 7);
  const monthStart = `${month}-01T00:00:00.000Z`;
  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = prevDate.toISOString().slice(0, 7);

  // Run all aggregate queries in parallel
  const [
    totalLeadsResult,
    conversionsResult,
    aiScoresResult,
    activeCampaignsResult,
    usageThisMonthResult,
    usagePrevMonthResult,
    clientConversionsResult,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("business_id", businessIds),
    supabase
      .from("conversions")
      .select("id", { count: "exact", head: true })
      .in("business_id", businessIds)
      .gte("converted_at", monthStart),
    supabase
      .from("leads")
      .select("business_id, ai_score")
      .in("business_id", businessIds)
      .not("ai_score", "is", null),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .in("business_id", businessIds)
      .eq("status", "active"),
    supabase
      .from("usage_tracking")
      .select("business_id, leads_count, sms_count, emails_count")
      .in("business_id", businessIds)
      .eq("month", month),
    supabase
      .from("usage_tracking")
      .select("business_id, leads_count")
      .in("business_id", businessIds)
      .eq("month", prevMonth),
    supabase
      .from("conversions")
      .select("business_id")
      .in("business_id", businessIds)
      .gte("converted_at", monthStart),
  ]);

  // Aggregate stats
  const totalLeads = totalLeadsResult.count ?? 0;
  const totalConversions = conversionsResult.count ?? 0;
  const activeCampaigns = activeCampaignsResult.count ?? 0;

  const allScores = (aiScoresResult.data ?? []).map((l) => l.ai_score as number);
  const avgAiScore =
    allScores.length > 0
      ? parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1))
      : null;

  const usageThisMonth = usageThisMonthResult.data ?? [];
  const leadsThisMonth = usageThisMonth.reduce((sum, u) => sum + (u.leads_count ?? 0), 0);
  const smsThisMonth = usageThisMonth.reduce((sum, u) => sum + (u.sms_count ?? 0), 0);
  const emailsThisMonth = usageThisMonth.reduce((sum, u) => sum + (u.emails_count ?? 0), 0);
  const messagesSent = emailsThisMonth + smsThisMonth;

  const usagePrevMonth = usagePrevMonthResult.data ?? [];
  const leadsPrevMonth = usagePrevMonth.reduce((sum, u) => sum + (u.leads_count ?? 0), 0);

  const conversionRate =
    leadsThisMonth > 0
      ? parseFloat(((totalConversions / leadsThisMonth) * 100).toFixed(1))
      : 0;

  // Per-client stats
  const usageByBusiness: Record<string, { leads: number; sms: number; emails: number }> = {};
  for (const u of usageThisMonth) {
    usageByBusiness[u.business_id] = {
      leads: u.leads_count ?? 0,
      sms: u.sms_count ?? 0,
      emails: u.emails_count ?? 0,
    };
  }

  const conversionsByBusiness: Record<string, number> = {};
  for (const c of clientConversionsResult.data ?? []) {
    if (c.business_id) {
      conversionsByBusiness[c.business_id] = (conversionsByBusiness[c.business_id] ?? 0) + 1;
    }
  }

  const scoresByBusiness: Record<string, number[]> = {};
  for (const l of aiScoresResult.data ?? []) {
    if (!scoresByBusiness[l.business_id]) {
      scoresByBusiness[l.business_id] = [];
    }
    scoresByBusiness[l.business_id].push(l.ai_score as number);
  }

  const clients: ClientStats[] = (businesses ?? []).map((biz) => {
    const usage = usageByBusiness[biz.id] ?? { leads: 0, sms: 0, emails: 0 };
    const convCount = conversionsByBusiness[biz.id] ?? 0;
    const bizScores = scoresByBusiness[biz.id] ?? [];
    const bizAvgScore =
      bizScores.length > 0
        ? parseFloat((bizScores.reduce((a, b) => a + b, 0) / bizScores.length).toFixed(1))
        : null;
    const bizConvRate =
      usage.leads > 0
        ? parseFloat(((convCount / usage.leads) * 100).toFixed(1))
        : 0;

    return {
      id: biz.id,
      name: biz.name,
      type: biz.type,
      location_city: biz.location_city,
      location_state: biz.location_state,
      leads_this_month: usage.leads,
      conversions_this_month: convCount,
      conversion_rate: bizConvRate,
      avg_ai_score: bizAvgScore,
      messages_sent: usage.emails + usage.sms,
    };
  });

  // Sort clients by leads descending by default
  clients.sort((a, b) => b.leads_this_month - a.leads_this_month);

  const leadsChange = leadsPrevMonth > 0
    ? parseFloat((((leadsThisMonth - leadsPrevMonth) / leadsPrevMonth) * 100).toFixed(1))
    : null;

  const stats = [
    { label: "Total Leads", value: totalLeads.toLocaleString(), accent: "bg-blue-500" },
    { label: "Total Conversions", value: totalConversions.toLocaleString(), accent: "bg-emerald-500" },
    { label: "Avg AI Score", value: avgAiScore !== null ? avgAiScore.toString() : "--", accent: "bg-violet-500" },
    { label: "Active Campaigns", value: activeCampaigns.toLocaleString(), accent: "bg-orange-500" },
    { label: "Messages This Month", value: messagesSent.toLocaleString(), accent: "bg-blue-500" },
    { label: "Leads This Month", value: leadsThisMonth.toLocaleString(), accent: "bg-green-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{agency.name}</h1>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Agency Overview
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {memberCount ?? 0} team member{(memberCount ?? 0) !== 1 ? "s" : ""} / {businessIds.length} client{businessIds.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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

      {/* Monthly Trend Summary */}
      <div className="rounded-lg border px-4 py-3">
        <h2 className="text-lg font-semibold">Monthly Summary</h2>
        <p className="mt-2 text-sm text-slate-600">
          {leadsThisMonth} lead{leadsThisMonth !== 1 ? "s" : ""} this month across {businessIds.length} client{businessIds.length !== 1 ? "s" : ""}, {conversionRate}% conversion rate.
          {leadsChange !== null && (
            <span className={leadsChange >= 0 ? " text-green-600" : " text-red-500"}>
              {" "}{leadsChange >= 0 ? "+" : ""}{leadsChange}% vs last month.
            </span>
          )}
          {leadsChange === null && leadsPrevMonth === 0 && leadsThisMonth > 0 && (
            <span className="text-slate-400"> No data from last month to compare.</span>
          )}
        </p>
      </div>

      {/* Client Performance Table */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Client Performance</h2>
          <Link href="/agency" className="text-sm text-slate-500 hover:text-slate-900">
            Manage Clients
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-slate-500">
                <th className="pb-2 pr-4">Business</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Leads (month)</th>
                <th className="pb-2 pr-4">Conversions (month)</th>
                <th className="pb-2 pr-4">Conv. Rate</th>
                <th className="pb-2 pr-4">Avg AI Score</th>
                <th className="pb-2">Messages</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/agency/clients/${client.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {client.name}
                    </Link>
                    {client.location_city && (
                      <p className="text-xs text-slate-400">
                        {client.location_city}, {client.location_state}
                      </p>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {client.type}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-medium">{client.leads_this_month}</td>
                  <td className="py-2 pr-4 font-medium">{client.conversions_this_month}</td>
                  <td className="py-2 pr-4">{client.conversion_rate}%</td>
                  <td className={`py-2 pr-4 font-semibold ${scoreColor(client.avg_ai_score)}`}>
                    {client.avg_ai_score ?? "--"}
                  </td>
                  <td className="py-2">{client.messages_sent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
