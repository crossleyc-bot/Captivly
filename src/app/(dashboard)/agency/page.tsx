import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requirePlan } from "@/lib/feature-gate";
import type { PlanTier } from "@/types/database";
import Link from "next/link";
import { CreateAgency } from "./create-agency";
import { InviteMember } from "./invite-member";

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
            className="mt-3 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    );
  }

  // Check if user owns an agency
  let agency: { id: string; owner_user_id: string; name: string; logo_url: string | null; created_at: string } | null = null;
  let userRole = "owner";

  const { data: ownedAgency } = await supabase
    .from("agencies")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  if (ownedAgency) {
    agency = ownedAgency;
  } else {
    // Check if user is a member of an agency
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
          <p className="mt-1 text-sm text-zinc-500">
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{agency.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your team and client accounts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-zinc-500">Team Members</p>
          <p className="mt-1 text-2xl font-bold">{members?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-zinc-500">Client Accounts</p>
          <p className="mt-1 text-2xl font-bold">{clients?.length ?? 0}</p>
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
                  <p className="text-xs text-zinc-400">{memberUser?.email}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    member.role === "owner"
                      ? "bg-indigo-600 text-white"
                      : member.role === "admin"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-zinc-100 text-zinc-600"
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
        <h2 className="text-lg font-semibold">Client Accounts</h2>
        {!clients?.length ? (
          <p className="text-sm text-zinc-400">
            No client accounts yet. Client businesses will appear here once added to your agency.
          </p>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-zinc-400">
                      {client.type} — {client.location_city}, {client.location_state}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {new Date(client.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
