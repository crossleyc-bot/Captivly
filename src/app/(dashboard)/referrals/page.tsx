import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateReferralLink } from "./create-referral-link";
import { ReferralLinkRow } from "./referral-link-row";

export default async function ReferralsPage() {
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

  // Fetch referral links with referral counts
  const { data: links } = await supabase
    .from("referral_links")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  // Fetch recent referrals
  const { data: referrals } = await supabase
    .from("referrals")
    .select("*, link:referral_links(code, referrer_name), lead:leads(first_name, last_name, email)")
    .eq("business_id", business.id)
    .neq("status", "clicked")
    .order("created_at", { ascending: false })
    .limit(20);

  const totalClicks = (links ?? []).reduce((sum, l) => sum + (l.clicks ?? 0), 0);
  const totalConversions = (links ?? []).reduce((sum, l) => sum + (l.conversions ?? 0), 0);
  const activeLinks = (links ?? []).filter((l) => l.is_active).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Referral Tracking</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create referral links for your customers and track who they bring in.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-zinc-500">Active Links</p>
          <p className="mt-1 text-2xl font-bold">{activeLinks}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-zinc-500">Total Clicks</p>
          <p className="mt-1 text-2xl font-bold">{totalClicks}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-zinc-500">Conversions</p>
          <p className="mt-1 text-2xl font-bold">{totalConversions}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-zinc-500">Conversion Rate</p>
          <p className="mt-1 text-2xl font-bold">
            {totalClicks > 0
              ? `${Math.round((totalConversions / totalClicks) * 100)}%`
              : "—"}
          </p>
        </div>
      </div>

      {/* Create link */}
      <CreateReferralLink />

      {/* Referral links table */}
      <div>
        <h2 className="text-lg font-semibold">Referral Links</h2>
        {!links?.length ? (
          <p className="mt-3 text-sm text-zinc-400">
            No referral links yet. Create one above.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-zinc-500">
                  <th className="pb-2 pr-4 font-medium">Referrer</th>
                  <th className="pb-2 pr-4 font-medium">Code</th>
                  <th className="pb-2 pr-4 font-medium">Clicks</th>
                  <th className="pb-2 pr-4 font-medium">Conversions</th>
                  <th className="pb-2 pr-4 font-medium">Rate</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <ReferralLinkRow key={link.id} link={link} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent referrals */}
      <div>
        <h2 className="text-lg font-semibold">Recent Referrals</h2>
        {!referrals?.length ? (
          <p className="mt-3 text-sm text-zinc-400">No referrals yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {referrals.map((ref) => {
              const link = ref.link as { code: string; referrer_name: string | null } | null;
              const lead = ref.lead as {
                first_name: string | null;
                last_name: string | null;
                email: string | null;
              } | null;
              return (
                <div
                  key={ref.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {lead?.first_name ?? "Unknown"} {lead?.last_name ?? ""}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Referred by {link?.referrer_name ?? link?.code ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        ref.status === "converted"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {ref.status}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
