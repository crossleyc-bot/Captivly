import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (!campaign) notFound();

  // Fetch campaign leads
  const { data: leads } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, ai_score, status, created_at")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch sequences for this campaign
  const { data: sequences } = await supabase
    .from("sequences")
    .select("id, name, is_active, sequence_steps(id, step_number, channel, delay_days)")
    .eq("campaign_id", id);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-zinc-100 text-zinc-600",
      active: "bg-green-100 text-green-700",
      paused: "bg-yellow-100 text-yellow-700",
      completed: "bg-blue-100 text-blue-700",
    };
    return colors[status] ?? "bg-zinc-100 text-zinc-600";
  };

  const scoreColor = (score: number | null) => {
    if (!score) return "text-zinc-400";
    if (score >= 8) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-500";
  };

  const leadStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-700",
      in_sequence: "bg-purple-100 text-purple-700",
      replied: "bg-green-100 text-green-700",
      converted: "bg-emerald-100 text-emerald-700",
      cold: "bg-zinc-100 text-zinc-600",
      unsubscribed: "bg-red-100 text-red-600",
    };
    return colors[status] ?? "bg-zinc-100 text-zinc-600";
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link href="/campaigns" className="text-sm text-zinc-500 hover:text-zinc-900">
          &larr; Back to campaigns
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(campaign.status)}`}>
            {campaign.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border px-4 py-3">
          <p className="text-xs font-medium text-zinc-500">Leads</p>
          <p className="mt-1 text-2xl font-bold">{campaign.leads_count}</p>
        </div>
        <div className="rounded-lg border px-4 py-3">
          <p className="text-xs font-medium text-zinc-500">Conversions</p>
          <p className="mt-1 text-2xl font-bold">{campaign.conversions_count}</p>
        </div>
        <div className="rounded-lg border px-4 py-3">
          <p className="text-xs font-medium text-zinc-500">Daily Budget</p>
          <p className="mt-1 text-2xl font-bold">
            {campaign.daily_budget_cents
              ? `$${(campaign.daily_budget_cents / 100).toFixed(2)}`
              : "—"}
          </p>
        </div>
        <div className="rounded-lg border px-4 py-3">
          <p className="text-xs font-medium text-zinc-500">Total Spend</p>
          <p className="mt-1 text-2xl font-bold">
            ${(campaign.total_spend_cents / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Sequences */}
      {sequences && sequences.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Sequences</h2>
          <div className="mt-3 space-y-2">
            {sequences.map((seq) => {
              const steps = (seq.sequence_steps ?? []) as Array<{
                id: string;
                step_number: number;
                channel: string;
                delay_days: number;
              }>;
              return (
                <div key={seq.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{seq.name}</span>
                    <span className={`text-xs ${seq.is_active ? "text-green-600" : "text-zinc-400"}`}>
                      {seq.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {steps
                      .sort((a, b) => a.step_number - b.step_number)
                      .map((step) => (
                        <span
                          key={step.id}
                          className="rounded bg-zinc-100 px-2 py-0.5 text-xs"
                        >
                          Day {step.delay_days}: {step.channel}
                        </span>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leads table */}
      <div>
        <h2 className="text-lg font-semibold">Leads</h2>
        {!leads?.length ? (
          <p className="mt-3 text-sm text-zinc-400">No leads in this campaign yet.</p>
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
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {lead.first_name ?? "Unknown"} {lead.last_name ?? ""}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-zinc-600">{lead.email ?? "—"}</td>
                    <td className={`py-2 pr-4 font-semibold ${scoreColor(lead.ai_score)}`}>
                      {lead.ai_score ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${leadStatusBadge(lead.status)}`}>
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
