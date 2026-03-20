import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { campaignStatusBadge } from "@/lib/ui-utils";

export default async function CampaignsPage() {
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

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your Meta Lead Ad campaigns.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New Campaign
        </Link>
      </div>

      {!campaigns?.length ? (
        <p className="text-sm text-zinc-400">No campaigns yet.</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="block rounded-lg border p-4 hover:border-zinc-400"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{c.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${campaignStatusBadge(c.status)}`}>
                  {c.status}
                </span>
              </div>
              <div className="mt-2 flex gap-6 text-sm text-zinc-500">
                <span>{c.leads_count} leads</span>
                <span>{c.conversions_count} conversions</span>
                {c.daily_budget_cents && (
                  <span>${(c.daily_budget_cents / 100).toFixed(2)}/day budget</span>
                )}
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
