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
          <p className="mt-1 text-sm text-slate-500">
            Manage your lead generation campaigns across all ad platforms.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Campaign
        </Link>
      </div>

      {!campaigns?.length ? (
        <p className="text-sm text-slate-400">No campaigns yet.</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="block rounded-lg border p-4 hover:border-slate-400"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{c.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${campaignStatusBadge(c.status)}`}>
                  {c.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: c.meta_campaign_id
                        ? "#1877F2"
                        : c.google_campaign_id
                          ? "#4285F4"
                          : c.tiktok_campaign_id
                            ? "#000000"
                            : c.linkedin_campaign_id
                              ? "#0A66C2"
                              : "#94a3b8",
                    }}
                  />
                  {c.meta_campaign_id
                    ? "Meta"
                    : c.google_campaign_id
                      ? "Google"
                      : c.tiktok_campaign_id
                        ? "TikTok"
                        : c.linkedin_campaign_id
                          ? "LinkedIn"
                          : "Manual"}
                </span>
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
