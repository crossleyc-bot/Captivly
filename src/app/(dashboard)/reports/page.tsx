import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requirePlan } from "@/lib/feature-gate";
import type { PlanTier, ReportCard } from "@/types/database";
import Link from "next/link";

export default async function ReportsPage() {
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
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-bold">Monthly Report Cards</h1>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center">
          <p className="text-sm text-zinc-500">
            AI monthly report cards are available on the{" "}
            <span className="font-semibold text-zinc-900">Pro plan</span>.
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  const { data: reports } = await supabase
    .from("report_cards")
    .select("*")
    .eq("business_id", business.id)
    .order("month", { ascending: false })
    .limit(12);

  const reportCards = (reports ?? []) as ReportCard[];

  function formatMonth(month: string): string {
    const [year, m] = month.split("-");
    const date = new Date(Number(year), Number(m) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Monthly Report Cards</h1>
        <p className="mt-1 text-sm text-zinc-500">
          AI-generated performance summaries delivered on the 1st of each month.
        </p>
      </div>

      {reportCards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center">
          <p className="text-sm text-zinc-500">
            No report cards yet. Your first report will be generated on the 1st
            of next month.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reportCards.map((report) => {
            const metrics = report.metrics as Record<string, unknown>;
            return (
              <article
                key={report.id}
                className="space-y-4 rounded-lg border p-6"
              >
                <header className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {formatMonth(report.month)}
                  </h2>
                  <span className="text-xs text-zinc-400">
                    Generated{" "}
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </header>

                <section>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Summary
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                    {report.summary}
                  </p>
                </section>

                <section>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Top Insight
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                    {report.top_insight}
                  </p>
                </section>

                <section>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Recommendation
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                    {report.recommendation}
                  </p>
                </section>

                {/* Key metrics grid */}
                <section className="grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-zinc-400">Leads</p>
                    <p className="text-lg font-semibold">
                      {String(metrics.total_leads ?? "—")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Avg Score</p>
                    <p className="text-lg font-semibold">
                      {String(metrics.avg_ai_score ?? "—")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Conversions</p>
                    <p className="text-lg font-semibold">
                      {String(metrics.total_conversions ?? "—")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Conv. Rate</p>
                    <p className="text-lg font-semibold">
                      {String(metrics.conversion_rate ?? "—")}
                    </p>
                  </div>
                </section>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
