import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatCents, scoreColor, dealActivityBadge } from "@/lib/ui-utils";
import { DealActions } from "./deal-actions";

export default async function DealDetailPage({
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

  // Fetch deal with lead and stage
  const { data: deal } = await supabase
    .from("deals")
    .select("*, lead:leads(id, first_name, last_name, email, phone, ai_score, status), stage:pipeline_stages(id, name, color, is_won, is_lost)")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (!deal) notFound();

  // Fetch all stages for the move selector
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .eq("business_id", business.id)
    .order("position", { ascending: true });

  // Fetch activity timeline
  const { data: activities } = await supabase
    .from("deal_activities")
    .select("*, from_stage:pipeline_stages!deal_activities_from_stage_id_fkey(name, color), to_stage:pipeline_stages!deal_activities_to_stage_id_fkey(name, color)")
    .eq("deal_id", id)
    .order("created_at", { ascending: false });

  const stage = deal.stage as { id: string; name: string; color: string; is_won: boolean; is_lost: boolean } | null;
  const lead = deal.lead as { id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; ai_score: number | null; status: string } | null;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/pipeline" className="text-sm text-slate-500 hover:text-slate-900">
          &larr; Back to pipeline
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{deal.title}</h1>
        {stage && (
          <div className="mt-1 flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-sm font-medium text-slate-600">{stage.name}</span>
            {stage.is_won && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Won</span>
            )}
            {stage.is_lost && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Lost</span>
            )}
          </div>
        )}
      </div>

      {/* Deal info */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm">
        <div>
          <span className="text-slate-500">Value</span>
          <p className="text-lg font-bold">{deal.value_cents > 0 ? formatCents(deal.value_cents) : "—"}</p>
        </div>
        <div>
          <span className="text-slate-500">Expected Close</span>
          <p className="font-medium">
            {deal.expected_close_date
              ? new Date(deal.expected_close_date).toLocaleDateString()
              : "—"}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Created</span>
          <p className="font-medium">
            {new Date(deal.created_at).toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Last Updated</span>
          <p className="font-medium">
            {new Date(deal.updated_at).toLocaleDateString()}
          </p>
        </div>
        {deal.closed_at && (
          <div>
            <span className="text-slate-500">Closed</span>
            <p className="font-medium">
              {new Date(deal.closed_at).toLocaleDateString()}
            </p>
          </div>
        )}
        {deal.notes && (
          <div className="col-span-2">
            <span className="text-slate-500">Notes</span>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">{deal.notes}</p>
          </div>
        )}
      </div>

      {/* Linked lead */}
      {lead && (
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Linked Lead</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Name</span>
              <p>
                <Link href={`/leads/${lead.id}`} className="font-medium text-teal-600 hover:underline">
                  {lead.first_name ?? "Unknown"} {lead.last_name ?? ""}
                </Link>
              </p>
            </div>
            <div>
              <span className="text-slate-500">Email</span>
              <p className="font-medium">{lead.email ?? "—"}</p>
            </div>
            <div>
              <span className="text-slate-500">Phone</span>
              <p className="font-medium">{lead.phone ?? "—"}</p>
            </div>
            <div>
              <span className="text-slate-500">AI Score</span>
              <p className={`font-bold ${scoreColor(lead.ai_score)}`}>
                {lead.ai_score ?? "—"}{lead.ai_score ? "/10" : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deal actions (client component for interactivity) */}
      <DealActions dealId={deal.id} stages={stages ?? []} currentStageId={deal.stage_id} />

      {/* Activity timeline */}
      <div>
        <h2 className="text-lg font-semibold">Activity</h2>
        {!activities?.length ? (
          <p className="mt-3 text-sm text-slate-400">No activity yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {activities.map((activity) => {
              const fromStage = activity.from_stage as { name: string; color: string } | null;
              const toStage = activity.to_stage as { name: string; color: string } | null;

              return (
                <div key={activity.id} className="flex gap-3 rounded-lg border p-3">
                  <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${dealActivityBadge(activity.type)}`}>
                    {activity.type.replace("_", " ")}
                  </span>
                  <div className="flex-1">
                    {activity.type === "stage_change" || activity.type === "closed" ? (
                      <p className="text-sm text-slate-700">
                        {fromStage && (
                          <>
                            <span className="inline-flex items-center gap-1">
                              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: fromStage.color }} />
                              {fromStage.name}
                            </span>
                            <span className="mx-1 text-slate-400">&rarr;</span>
                          </>
                        )}
                        {toStage && (
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: toStage.color }} />
                            {toStage.name}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-700">{activity.content}</p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
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
