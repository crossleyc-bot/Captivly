import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { scoreColor, leadStatusBadge } from "@/lib/ui-utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  const month = new Date().toISOString().slice(0, 7);

  // Fetch stats in parallel
  const [leadsResult, campaignsResult, conversionsResult, usageResult, recentLeadsResult] =
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
    ]);

  const totalLeads = leadsResult.count ?? 0;
  const activeCampaigns = campaignsResult.count ?? 0;
  const totalConversions = conversionsResult.count ?? 0;
  const usage = usageResult.data;
  const recentLeads = recentLeadsResult.data ?? [];

  const stats = [
    { label: "Total Leads", value: totalLeads, accent: "bg-indigo-500" },
    { label: "Active Campaigns", value: activeCampaigns, accent: "bg-blue-500" },
    { label: "Conversions", value: totalConversions, accent: "bg-emerald-500" },
    { label: "Emails This Month", value: usage?.emails_count ?? 0, accent: "bg-violet-500" },
    { label: "SMS This Month", value: usage?.sms_count ?? 0, accent: "bg-amber-500" },
  ];


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of your leads, campaigns, and outreach performance.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="overflow-hidden rounded-lg border px-4 py-3"
          >
            <div className={`-mx-4 -mt-3 mb-3 h-1 ${stat.accent}`} />
            <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Recent leads */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Leads</h2>
          <Link href="/leads" className="text-sm text-zinc-500 hover:text-zinc-900">
            View all
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center">
            <p className="text-sm font-medium text-zinc-600">No leads yet</p>
            <p className="mt-1 text-sm text-zinc-400">
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
                <tr className="border-b text-left text-xs font-medium text-zinc-500">
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
                    <td className="py-2 pr-4 text-zinc-600">
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
                    <td className="py-2 text-zinc-500">
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
