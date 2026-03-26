import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { requirePlan } from "@/lib/feature-gate";
import { scoreColor, leadStatusBadge, campaignStatusBadge } from "@/lib/ui-utils";
import type { PlanTier } from "@/types/database";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgencyClientDetailPage({ params }: PageProps) {
  const { id: businessId } = await params;
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
  let agencyId: string | null = null;

  const { data: ownedAgency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (ownedAgency) {
    agencyId = ownedAgency.id;
  } else {
    const { data: membership } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .single();

    agencyId = membership?.agency_id ?? null;
  }

  if (!agencyId) {
    redirect("/agency");
  }

  // Verify this business belongs to the user's agency
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, type, location_city, location_state, location_zip, primary_offer, outreach_tone, created_at")
    .eq("id", businessId)
    .eq("agency_id", agencyId)
    .single();

  if (!business) {
    notFound();
  }

  const month = new Date().toISOString().slice(0, 7);
  const monthStart = `${month}-01T00:00:00.000Z`;

  // Fetch all stats in parallel
  const [
    usageResult,
    leadsCountResult,
    conversionsResult,
    aiScoresResult,
    recentLeadsResult,
    campaignsResult,
  ] = await Promise.all([
    supabase
      .from("usage_tracking")
      .select("leads_count, sms_count, emails_count")
      .eq("business_id", business.id)
      .eq("month", month)
      .single(),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("conversions")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("converted_at", monthStart),
    supabase
      .from("leads")
      .select("ai_score")
      .eq("business_id", business.id)
      .not("ai_score", "is", null),
    supabase
      .from("leads")
      .select("id, first_name, last_name, email, ai_score, status, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("campaigns")
      .select("id, name, status, leads_count, conversions_count, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
  ]);

  const usage = usageResult.data;
  const totalLeads = leadsCountResult.count ?? 0;
  const conversionsThisMonth = conversionsResult.count ?? 0;
  const recentLeads = recentLeadsResult.data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  const scores = (aiScoresResult.data ?? []).map((l) => l.ai_score as number);
  const avgAiScore =
    scores.length > 0
      ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
      : null;

  const leadsThisMonth = usage?.leads_count ?? 0;
  const smsThisMonth = usage?.sms_count ?? 0;
  const emailsThisMonth = usage?.emails_count ?? 0;

  const stats = [
    { label: "Leads This Month", value: leadsThisMonth.toLocaleString(), accent: "bg-blue-500" },
    { label: "Conversions (month)", value: conversionsThisMonth.toLocaleString(), accent: "bg-emerald-500" },
    { label: "Avg AI Score", value: avgAiScore !== null ? avgAiScore.toString() : "--", accent: "bg-violet-500" },
    { label: "Emails Sent", value: emailsThisMonth.toLocaleString(), accent: "bg-blue-500" },
    { label: "SMS Sent", value: smsThisMonth.toLocaleString(), accent: "bg-orange-500" },
    { label: "Active Campaigns", value: activeCampaigns.length.toLocaleString(), accent: "bg-green-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/agency" className="hover:text-slate-600">
            Agency
          </Link>
          <span>/</span>
          <Link href="/agency/overview" className="hover:text-slate-600">
            Clients
          </Link>
          <span>/</span>
          <span className="text-slate-600">{business.name}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {business.type}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {business.location_city && (
            <span>
              {business.location_city}, {business.location_state}
              {business.location_zip ? ` ${business.location_zip}` : ""}
            </span>
          )}
          {business.primary_offer && (
            <span className="ml-3 text-slate-400">
              Offer: {business.primary_offer}
            </span>
          )}
        </p>
      </div>

      {/* Stat Cards */}
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

      {/* All-time summary */}
      <div className="rounded-lg border px-4 py-3">
        <p className="text-sm text-slate-600">
          <span className="font-medium">{totalLeads.toLocaleString()}</span> total leads across{" "}
          <span className="font-medium">{campaigns.length}</span> campaign{campaigns.length !== 1 ? "s" : ""}.{" "}
          {avgAiScore !== null && (
            <span>
              Average lead quality score:{" "}
              <span className={`font-semibold ${scoreColor(avgAiScore)}`}>{avgAiScore}</span>.
            </span>
          )}
        </p>
      </div>

      {/* Active Campaigns */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
            <p className="text-sm text-slate-400">No campaigns yet for this client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-slate-500">
                  <th className="pb-2 pr-4">Campaign</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Leads</th>
                  <th className="pb-2 pr-4">Conversions</th>
                  <th className="pb-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{campaign.name}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${campaignStatusBadge(campaign.status)}`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{campaign.leads_count}</td>
                    <td className="py-2 pr-4">{campaign.conversions_count}</td>
                    <td className="py-2 text-slate-400">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Leads */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Leads</h2>
        {recentLeads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
            <p className="text-sm text-slate-400">No leads yet for this client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    <td className="py-2 pr-4 font-medium">
                      {lead.first_name ?? "Unknown"} {lead.last_name ?? ""}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {lead.email ?? "--"}
                    </td>
                    <td
                      className={`py-2 pr-4 font-semibold ${scoreColor(lead.ai_score)}`}
                    >
                      {lead.ai_score ?? "--"}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${leadStatusBadge(lead.status)}`}
                      >
                        {lead.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2 text-slate-400">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Back link */}
      <div>
        <Link
          href="/agency/overview"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Back to Agency Overview
        </Link>
      </div>
    </div>
  );
}
