import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCents } from "@/lib/ui-utils";
import { PipelineBoard } from "./pipeline-board";

export default async function PipelinePage() {
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

  // Ensure default stages exist
  const { data: existingStages } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("business_id", business.id)
    .limit(1);

  if (!existingStages?.length) {
    await supabase.rpc("create_default_pipeline_stages", {
      p_business_id: business.id,
    });
  }

  // Fetch stages and deals in parallel
  const [stagesResult, dealsResult] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("*")
      .eq("business_id", business.id)
      .order("position", { ascending: true }),
    supabase
      .from("deals")
      .select("*, lead:leads(id, first_name, last_name, email, ai_score)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
  ]);

  const stages = stagesResult.data ?? [];
  const deals = dealsResult.data ?? [];

  // Compute pipeline summary
  const openDeals = deals.filter(
    (d) => !stages.find((s) => s.id === d.stage_id)?.is_won && !stages.find((s) => s.id === d.stage_id)?.is_lost
  );
  const wonDeals = deals.filter((d) => stages.find((s) => s.id === d.stage_id)?.is_won);
  const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.value_cents ?? 0), 0);
  const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.value_cents ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track and manage your deals through each stage.
        </p>
      </div>

      {/* Pipeline summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Open Deals</p>
          <p className="mt-1 text-2xl font-bold">{openDeals.length}</p>
        </div>
        <div className="rounded-lg border px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Pipeline Value</p>
          <p className="mt-1 text-2xl font-bold">{formatCents(totalPipelineValue)}</p>
        </div>
        <div className="rounded-lg border px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Won Deals</p>
          <p className="mt-1 text-2xl font-bold">{wonDeals.length}</p>
        </div>
        <div className="rounded-lg border px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Won Value</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{formatCents(totalWonValue)}</p>
        </div>
      </div>

      {/* Kanban board */}
      <PipelineBoard stages={stages} deals={deals} />
    </div>
  );
}
