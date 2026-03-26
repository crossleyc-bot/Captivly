import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requirePlan } from "@/lib/feature-gate";
import { scoreColor } from "@/lib/ui-utils";
import type { PlanTier } from "@/types/database";
import Link from "next/link";
import { CreateAgency } from "./create-agency";
import { InviteMember } from "./invite-member";
import { AddClient } from "./add-client";
import { ClientSwitcher } from "./client-switcher";

export default async function AgencyPage() {
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
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">Agency Mode</h1>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="text-sm text-yellow-800">
            Agency mode is available on the <strong>Pro plan</strong>.
            Upgrade to manage multiple client accounts.
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    );
  }

  // Check if user owns an agency
  let agency: {
    id: string;
    owner_user_id: string;
    name: string;
    logo_url: string | null;
    created_at: string;
  } | null = null;
  let userRole = "owner";

  const { data: ownedAgency } = await supabase
    .from("agencies")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  if (ownedAgency) {
    agency = ownedAgency;
  } else {
    const { data: membership } = await supabase
      .from("agency_members")
      .select("role, agency:agencies(*)")
      .eq("user_id", user.id)
      .single();

    if (membership?.agency) {
      agency = membership.agency as unknown as typeof agency;
      userRole = membership.role;
    }
  }

  if (!agency) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Agency Mode</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create an agency to manage multiple client businesses from one dashboard.
          </p>
        </div>
        <CreateAgency />
      </div>
    );
  }

  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  // Fetch members
  const { data: members } = await supabase
    .from("agency_members")
    .select("*, user:users(email, full_name)")
    .eq("agency_id", agency.id)
    .order("created_at", { ascending: true });

  // Fetch client businesses
  const { data: clients } = await supabase
    .from("businesses")
    .select("id, name, type, location_city, location_state, created_at, user_id")
    .eq("agency_id", agency.id)
    .order("created_at", { ascending: false });

  const month = new Date().toISOString().slice(0, 7);
  const monthStart = `${month}-01T00:00:00.000Z`;
  const clientIds = (clients ?? []).map((c) => c.id);

  // Fetch aggregate stats for the stat cards (only if there are clients)
  let leadsThisMonth = 0;
  let conversionsThisMonth = 0;
  const clientPerformance: Record<
    string,
    { leads: number; conversions: number; avg_score: number | null }
  > = {};

  if (clientIds.length > 0) {
    const [usageResult, conversionsResult, scoresResult] = await Promise.all([
      supabase
        .from("usage_tracking")
        .select("business_id, leads_count")
        .in("business_id", clientIds)
        .eq("month", month),
      supabase
        .from("conversions")
        .select("business_id")
        .in("business_id", clientIds)
        .gte("converted_at", monthStart),
      supabase
        .from("leads")
        .select("business_id, ai_score")
        .in("business_id", clientIds)
        .not("ai_score", "is", null),
    ]);

    // Usage aggregation
    for (const u of usageResult.data ?? []) {
      leadsThisMonth += u.leads_count ?? 0;
      if (!clientPerformance[u.business_id]) {
        clientPerformance[u.business_id] = { leads: 0, conversions: 0, avg_score: null };
      }
      clientPerformance[u.business_id].leads = u.leads_count ?? 0;
    }

    // Conversions aggregation
    for (const c of conversionsResult.data ?? []) {
      if (c.business_id) {
        conversionsThisMonth++;
        if (!clientPerformance[c.business_id]) {
          clientPerformance[c.business_id] = { leads: 0, conversions: 0, avg_score: null };
        }
        clientPerformance[c.business_id].conversions++;
      }
    }

    // AI scores per client
    const scoresByBusiness: Record<string, number[]> = {};
    for (const l of scoresResult.data ?? []) {
      if (!scoresByBusiness[l.business_id]) {
        scoresByBusiness[l.business_id] = [];
      }
      scoresByBusiness[l.business_id].push(l.ai_score as number);
    }
    for (const [bizId, scores] of Object.entries(scoresByBusiness)) {
      if (!clientPerformance[bizId]) {
        clientPerformance[bizId] = { leads: 0, conversions: 0, avg_score: null };
      }
      clientPerformance[bizId].avg_score = parseFloat(
        (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      );
    }
  }

  const clientSwitcherData = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{agency.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your team, clients, and view aggregate performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/agency/overview"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* Client Switcher */}
      <div className="max-w-xs">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Quick Navigation
        </label>
        <ClientSwitcher clients={clientSwitcherData} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="overflow-hidden rounded-lg border px-4 py-3">
          <div className="-mx-4 -mt-3 mb-3 h-1 bg-blue-500" />
          <p className="text-xs font-medium text-slate-500">Team Members</p>
          <p className="mt-1 text-2xl font-bold">{members?.length ?? 0}</p>
        </div>
        <div className="overflow-hidden rounded-lg border px-4 py-3">
          <div className="-mx-4 -mt-3 mb-3 h-1 bg-violet-500" />
          <p className="text-xs font-medium text-slate-500">Clients</p>
          <p className="mt-1 text-2xl font-bold">{clients?.length ?? 0}</p>
        </div>
        <div className="overflow-hidden rounded-lg border px-4 py-3">
          <div className="-mx-4 -mt-3 mb-3 h-1 bg-green-500" />
          <p className="text-xs font-medium text-slate-500">Leads This Month</p>
          <p className="mt-1 text-2xl font-bold">{leadsThisMonth}</p>
        </div>
        <div className="overflow-hidden rounded-lg border px-4 py-3">
          <div className="-mx-4 -mt-3 mb-3 h-1 bg-emerald-500" />
          <p className="text-xs font-medium text-slate-500">Conversions This Month</p>
          <p className="mt-1 text-2xl font-bold">{conversionsThisMonth}</p>
        </div>
      </div>

      {/* Team Members */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Team Members</h2>
        <div className="space-y-2">
          {members?.map((member) => {
            const memberUser = member.user as {
              email: string;
              full_name: string | null;
            } | null;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">
                    {memberUser?.full_name ?? memberUser?.email ?? "Unknown"}
                  </p>
                  <p className="text-xs text-slate-400">{memberUser?.email}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    member.role === "owner"
                      ? "bg-blue-600 text-white"
                      : member.role === "admin"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {member.role}
                </span>
              </div>
            );
          })}
        </div>
        {isOwnerOrAdmin && <InviteMember />}
      </section>

      {/* Client Businesses */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Client Accounts</h2>
          {(clients?.length ?? 0) > 0 && (
            <Link
              href="/agency/overview"
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              View all analytics
            </Link>
          )}
        </div>

        {!clients?.length ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">No client accounts yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Add a client business by looking up their account email below.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-slate-500">
                  <th className="pb-2 pr-4">Business</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Location</th>
                  <th className="pb-2 pr-4">Leads (month)</th>
                  <th className="pb-2 pr-4">Conv. (month)</th>
                  <th className="pb-2 pr-4">Avg Score</th>
                  <th className="pb-2">Added</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const perf = clientPerformance[client.id] ?? {
                    leads: 0,
                    conversions: 0,
                    avg_score: null,
                  };
                  return (
                    <tr key={client.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <Link
                          href={`/agency/clients/${client.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {client.type}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-slate-500">
                        {client.location_city
                          ? `${client.location_city}, ${client.location_state}`
                          : "--"}
                      </td>
                      <td className="py-2 pr-4 font-medium">{perf.leads}</td>
                      <td className="py-2 pr-4 font-medium">{perf.conversions}</td>
                      <td
                        className={`py-2 pr-4 font-semibold ${scoreColor(perf.avg_score)}`}
                      >
                        {perf.avg_score ?? "--"}
                      </td>
                      <td className="py-2 text-slate-400">
                        {new Date(client.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Client */}
        {isOwnerOrAdmin && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700">Add a Client</h3>
            <p className="text-xs text-slate-400">
              Look up a business by its owner&apos;s email address to add it to your agency.
            </p>
            <AddClient />
          </div>
        )}
      </section>
    </div>
  );
}
