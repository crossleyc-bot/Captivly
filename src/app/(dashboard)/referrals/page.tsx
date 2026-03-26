import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateReferralLink } from "./create-referral-link";
import { ReferralLinkRow } from "./referral-link-row";
import { ShareReferralLink } from "./share-referral-link";

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

  // Fetch recent referrals (last 10 with all statuses for activity feed)
  const { data: referrals } = await supabase
    .from("referrals")
    .select("*, link:referral_links(code, referrer_name), lead:leads(first_name, last_name, email)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const totalClicks = (links ?? []).reduce((sum, l) => sum + (l.clicks ?? 0), 0);
  const totalConversions = (links ?? []).reduce((sum, l) => sum + (l.conversions ?? 0), 0);
  const totalSignups = (referrals ?? []).filter((r) => r.status === "signed_up" || r.status === "converted").length;
  const activeLinks = (links ?? []).filter((l) => l.is_active).length;

  // Find the first active link for the share section
  const primaryLink = (links ?? []).find((l) => l.is_active);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Referral Tracking</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create referral links for your customers and track who they bring in.
        </p>
      </div>

      {/* Share Your Link — only shown when there is an active link */}
      {primaryLink && (
        <ShareReferralLink code={primaryLink.code} referrerName={primaryLink.referrer_name} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-slate-500">Active Links</p>
          <p className="mt-1 text-2xl font-bold">{activeLinks}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-slate-500">Total Clicks</p>
          <p className="mt-1 text-2xl font-bold">{totalClicks}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-slate-500">Signups</p>
          <p className="mt-1 text-2xl font-bold">{totalSignups}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-slate-500">Conversions</p>
          <p className="mt-1 text-2xl font-bold">{totalConversions}</p>
        </div>
      </div>

      {/* Create link */}
      <CreateReferralLink />

      {/* Referral links table */}
      <div>
        <h2 className="text-lg font-semibold">Referral Links</h2>
        {!links?.length ? (
          <p className="mt-3 text-sm text-slate-400">
            No referral links yet. Create one above.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Referrer</th>
                  <th className="pb-2 pr-4 font-medium">Link</th>
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

      {/* Recent Referral Activity */}
      <div>
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        {!referrals?.length ? (
          <p className="mt-3 text-sm text-slate-400">No referral activity yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {referrals.map((ref) => {
              const link = ref.link as { code: string; referrer_name: string | null } | null;
              const lead = ref.lead as {
                first_name: string | null;
                last_name: string | null;
                email: string | null;
              } | null;

              const statusConfig: Record<string, { label: string; classes: string; icon: string }> = {
                clicked: {
                  label: "Clicked",
                  classes: "bg-slate-100 text-slate-600",
                  icon: "cursor",
                },
                signed_up: {
                  label: "Signed Up",
                  classes: "bg-blue-50 text-blue-700",
                  icon: "user",
                },
                converted: {
                  label: "Converted",
                  classes: "bg-green-50 text-green-700",
                  icon: "check",
                },
              };

              const config = statusConfig[ref.status] ?? statusConfig.clicked;

              return (
                <div
                  key={ref.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Status icon */}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${config.classes}`}>
                      {ref.status === "clicked" && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />
                        </svg>
                      )}
                      {ref.status === "signed_up" && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                        </svg>
                      )}
                      {ref.status === "converted" && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {lead?.first_name
                          ? `${lead.first_name} ${lead.last_name ?? ""}`.trim()
                          : ref.status === "clicked"
                            ? "Anonymous visitor"
                            : "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500">
                        via {link?.referrer_name ?? link?.code ?? "unknown link"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.classes}`}
                    >
                      {config.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How Referrals Work */}
      <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10">
        <h2 className="text-center text-lg font-semibold">How Referrals Work</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">1. Share Your Link</h3>
            <p className="mt-1 text-xs text-slate-500">
              Create a referral link and share it with your happy customers via text, email, or social media.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">2. Friend Signs Up</h3>
            <p className="mt-1 text-xs text-slate-500">
              When someone clicks your link, they see your offer and can sign up. The referral is tracked automatically.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">3. You Both Benefit</h3>
            <p className="mt-1 text-xs text-slate-500">
              You grow your customer base through word-of-mouth, and your referrers get credit for every conversion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
