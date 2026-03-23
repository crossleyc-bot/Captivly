import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "Real-Time Dashboard",
  description:
    "See every lead, message status, and conversion in one place. Know exactly how your campaigns are performing.",
  openGraph: {
    title: "Real-Time Dashboard - Captivly.ai",
    description:
      "See every lead, message status, and conversion in one place.",
    url: "https://captivly.ai/features/dashboard",
  },
};

export default function DashboardFeaturePage() {
  return (
    <FeatureLayout
      title="Real-Time Dashboard"
      description="See every lead, message status, and conversion in one place. Know exactly how your campaigns are performing without digging through spreadsheets."
      ctaHeading="See your leads in action"
      ctaDescription="Sign up and get a fully functional dashboard from day one."
    >
      {/* Metrics overview */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Everything at a glance
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
            Your dashboard surfaces the metrics that matter most for local
            lead generation.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                metric: "Total Leads",
                description:
                  "Track how many leads have come in across all campaigns this month.",
              },
              {
                metric: "AI Scores",
                description:
                  "See the quality breakdown of your leads — hot, warm, and cold at a glance.",
              },
              {
                metric: "Sequence Status",
                description:
                  "Monitor which leads are in-sequence, replied, converted, or cold.",
              },
              {
                metric: "Conversions",
                description:
                  "Track trial bookings, appointments set, and new members from your leads.",
              },
            ].map((item) => (
              <div
                key={item.metric}
                className="rounded-lg border p-4 text-center"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {item.metric}
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard features */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            Dashboard highlights
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Lead list with filtering
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Browse all your leads in a searchable, sortable table. Filter
                by campaign, status, AI score, or date range. Click any lead
                to see their full detail and message timeline.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Campaign performance
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Each campaign shows leads captured, messages sent, reply
                rates, and conversion counts. Compare campaigns to see what
                offers and audiences perform best.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Message timeline
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                View the complete outreach history for every lead. See which
                messages were sent, delivered, or replied to — with exact
                timestamps for each event.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Usage tracking
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Monitor your monthly lead and SMS usage against your plan
                limits. A progress bar shows how close you are to hitting your
                cap, with upgrade prompts when needed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
