import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "Google Reviews Automation",
  description:
    "After a lead converts, automatically trigger a review request sequence. Build social proof on Google while the experience is fresh.",
  openGraph: {
    title: "Google Reviews Automation - Captivly.ai",
    description:
      "Automatically trigger review requests after conversion. Build social proof on Google.",
    url: "https://captivly.ai/features/google-reviews",
  },
};

export default function GoogleReviewsPage() {
  return (
    <FeatureLayout
      title="Google Reviews Automation"
      description="After a lead converts, automatically trigger a review request sequence. Build social proof on Google while the experience is still fresh — without lifting a finger."
      ctaHeading="Turn customers into advocates"
      ctaDescription="Every conversion is an opportunity for a 5-star review. Let Captivly.ai ask for you, automatically."
    >
      {/* Why reviews matter */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Why Google Reviews matter for local businesses
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-teal-600">93%</div>
              <p className="mt-2 text-sm text-slate-600">
                of consumers read online reviews before choosing a local
                business
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-teal-600">4.0+</div>
              <p className="mt-2 text-sm text-slate-600">
                star rating is the minimum most consumers consider when
                choosing a business
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-teal-600">
                Top 3
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Google Reviews are a top ranking factor for local search
                and Google Maps visibility
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-4">
            {[
              {
                step: "1",
                title: "Lead converts",
                description:
                  "A lead books an appointment, signs up for a trial, or makes a purchase.",
              },
              {
                step: "2",
                title: "Wait period",
                description:
                  "Captivly.ai waits a configurable number of days (default: 3) for the experience to happen.",
              },
              {
                step: "3",
                title: "Review request",
                description:
                  "An AI-crafted email or SMS is sent with a direct link to your Google Reviews page.",
              },
              {
                step: "4",
                title: "Follow-up",
                description:
                  "If they don't leave a review, a gentle reminder is sent after a few more days.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-600">
                  {item.step}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example messages */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            AI-crafted review requests
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
            Messages are personalized based on the lead&apos;s name, the
            service they used, and your business&apos;s preferred tone.
          </p>
          <div className="mt-12 space-y-4">
            <div className="rounded-lg border p-5">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Email
                </span>
                <span className="text-xs text-slate-400">Day 3</span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-900">
                Subject: How was your first visit, Sarah?
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Hey Sarah! Thanks for coming in for your free trial at
                FitLife Gym. We hope you had a great workout! If you
                enjoyed the experience, we&apos;d love a quick Google
                review — it helps other locals find us. Just tap below,
                it takes 30 seconds.
              </p>
              <p className="mt-2 text-sm font-medium text-teal-600">
                [Leave a Review on Google]
              </p>
            </div>
            <div className="rounded-lg border p-5">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  SMS
                </span>
                <span className="text-xs text-slate-400">Day 7</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Hey Sarah, it&apos;s FitLife Gym! Quick favor — if you
                enjoyed your visit, a Google review would mean the world
                to us. Just tap: [link]. Thanks!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            Review automation features
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Direct Google review link
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Enter your Google Business Profile URL once in settings.
                Captivly.ai generates a direct review link that opens the
                Google review form — no searching required for the
                customer.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Configurable timing
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Set when the first review request goes out (e.g., 3 days
                after conversion) and when the follow-up reminder is sent
                (e.g., 7 days). Timing is key — too soon feels pushy, too
                late and they&apos;ve forgotten.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Sentiment-aware AI
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                If a lead replied negatively during the outreach sequence
                or showed dissatisfaction, Captivly.ai skips the review
                request. Only happy customers get asked — protecting your
                rating.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Review tracking
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                See which leads received review requests, who clicked the
                link, and track your overall review request conversion
                rate. Optimize timing and messaging over time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
