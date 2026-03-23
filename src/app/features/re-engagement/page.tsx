import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "Lead Re-Engagement Campaigns",
  description:
    "Automatically re-target cold leads after 30, 60, or 90 days with a fresh offer. Many just need the right message at the right time.",
  openGraph: {
    title: "Lead Re-Engagement Campaigns - Captivly.ai",
    description:
      "Automatically re-target cold leads with fresh offers after 30, 60, or 90 days.",
    url: "https://captivly.ai/features/re-engagement",
  },
};

export default function ReEngagementPage() {
  return (
    <FeatureLayout
      title="Lead Re-Engagement Campaigns"
      description="Automatically re-target cold leads after 30, 60, or 90 days with a fresh offer. Don't let old leads go to waste — many just need the right message at the right time."
      ctaHeading="Stop leaving money on the table"
      ctaDescription="Re-engage cold leads automatically and turn past interest into future revenue."
    >
      {/* The problem */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            The problem with &quot;cold&quot; leads
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
            Most businesses write off leads that don&apos;t convert in the
            first two weeks. But research shows that timing is everything.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600">60%</div>
              <p className="mt-2 text-sm text-slate-600">
                of leads that go cold were simply not ready to buy when they
                first enquired
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600">30–90</div>
              <p className="mt-2 text-sm text-slate-600">
                days is the typical consideration window for local service
                purchases
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600">5x</div>
              <p className="mt-2 text-sm text-slate-600">
                cheaper to re-engage an existing lead than to acquire a
                brand-new one
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            How re-engagement works
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Automatic cold lead detection
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Captivly.ai monitors every lead&apos;s status. When a lead
                completes their initial sequence without converting and is
                marked as &quot;cold,&quot; they become eligible for
                re-engagement.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Configurable timing windows
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Set when re-engagement should trigger: 30 days after going
                cold, 60 days, 90 days, or a custom interval. You can run
                multiple waves — each with a different offer or angle.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                AI-generated fresh messaging
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Claude AI crafts new outreach messages that are different
                from the original sequence. It references your latest offers,
                seasonal promotions, or new services — so the lead sees
                something genuinely new.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Respect opt-outs
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Leads who unsubscribed are never re-contacted. Captivly.ai
                checks the lead&apos;s status before every re-engagement
                send, ensuring compliance with email and SMS regulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example timeline */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Example re-engagement timeline
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
            A gym that originally offered a free 7-day trial.
          </p>
          <div className="mt-12 space-y-4">
            {[
              {
                day: "Day 0–14",
                label: "Initial sequence",
                description:
                  "5-step email + SMS sequence promoting the free trial. Lead doesn't convert and is marked cold.",
                status: "completed",
              },
              {
                day: "Day 44",
                label: "30-day re-engagement",
                description:
                  "\"Hey {name}, we just launched a new HIIT class! Your free trial is still waiting.\"",
                status: "re-engagement",
              },
              {
                day: "Day 74",
                label: "60-day re-engagement",
                description:
                  "\"Summer is around the corner — start now with 50% off your first month.\"",
                status: "re-engagement",
              },
              {
                day: "Day 104",
                label: "90-day re-engagement",
                description:
                  "\"We miss you, {name}! Here's a special comeback offer: 2 weeks free + a personal training session.\"",
                status: "re-engagement",
              },
            ].map((step) => (
              <div
                key={step.day}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <div
                  className={`flex h-8 shrink-0 items-center justify-center rounded-full px-3 text-xs font-bold ${
                    step.status === "completed"
                      ? "bg-slate-100 text-slate-500"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {step.day}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-slate-900">
                    {step.label}
                  </span>
                  <p className="mt-1 text-sm text-slate-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
