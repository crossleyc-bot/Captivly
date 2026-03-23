import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "AI Lead Scoring",
  description:
    "Every lead is instantly scored 1-10 by AI based on fit with your ideal customer profile. Focus on the leads most likely to convert.",
  openGraph: {
    title: "AI Lead Scoring - Captivly.ai",
    description:
      "Every lead is instantly scored 1-10 by AI based on fit with your ideal customer profile.",
    url: "https://captivly.ai/features/ai-lead-scoring",
  },
};

export default function AILeadScoringPage() {
  return (
    <FeatureLayout
      title="AI Lead Scoring"
      description="Every lead is instantly scored 1–10 by AI based on fit with your ideal customer profile. Stop wasting time on cold leads — focus on the ones most likely to convert."
      ctaHeading="Let AI find your best leads"
      ctaDescription="AI lead scoring is included on every plan. Sign up and start scoring leads instantly."
    >
      {/* Score breakdown */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            What the scores mean
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
            Each lead receives a quality score from 1 to 10 along with a
            plain-English explanation of why they scored that way.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
              <div className="text-3xl font-bold text-green-600">8–10</div>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Hot Lead
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Strong match for your target profile. Prioritize these leads
                for immediate outreach and personal follow-up.
              </p>
            </div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">5–7</div>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Warm Lead
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Moderate fit. These leads are worth nurturing through your
                automated sequence — many will convert over time.
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <div className="text-3xl font-bold text-red-500">1–4</div>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Cold Lead
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Low fit for your business. Automated sequences still engage
                them, but you won&apos;t waste time chasing unlikely
                conversions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How scoring works */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            How AI scoring works
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Instant, automatic scoring
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                The moment a lead arrives via your Meta webhook, Captivly.ai
                sends the lead data to Claude AI along with your business
                profile. A score and explanation are returned in seconds.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Context-aware analysis
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Scoring considers your business type, target age range,
                location, interests, and the lead&apos;s custom form answers.
                A gym targeting fitness enthusiasts in their 30s will score
                differently than a salon targeting young professionals.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Plain-English reasoning
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Every score comes with a human-readable explanation like
                &quot;Strong match: within target age range, local to service
                area, expressed interest in fitness.&quot; No black-box
                mystery.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Scores feed into outreach
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                High-scoring leads can be prioritized in your sequences with
                more urgent messaging, while lower-scoring leads receive a
                gentler nurture approach.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
