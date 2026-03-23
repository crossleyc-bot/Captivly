import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AutomationsList } from "./automations-list";

export default async function PipelineAutomationsPage() {
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

  // Check plan tier — automations require Growth or Pro
  const { data: dbUser } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const plan = dbUser?.plan_tier ?? "starter";

  const [automationsResult, stagesResult] = await Promise.all([
    supabase
      .from("pipeline_automations")
      .select("*, stage:pipeline_stages(id, name, color)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pipeline_stages")
      .select("*")
      .eq("business_id", business.id)
      .order("position", { ascending: true }),
  ]);

  const automations = automationsResult.data ?? [];
  const stages = stagesResult.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Automations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Trigger actions automatically when deals move to specific stages.
          </p>
        </div>
        <Link
          href="/pipeline"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Pipeline
        </Link>
      </div>

      {plan === "starter" ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Upgrade to unlock Pipeline Automations
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Pipeline automations are available on Growth ($99/mo) and Pro ($199/mo) plans.
            Automatically send emails, SMS, or update lead statuses when deals move through your pipeline.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-block rounded-md bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Upgrade Plan
          </Link>
        </div>
      ) : (
        <AutomationsList automations={automations} stages={stages} />
      )}
    </div>
  );
}
