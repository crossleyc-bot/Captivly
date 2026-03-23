import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "Meta Lead Ads Integration",
  description:
    "Connect your Facebook and Instagram ad accounts in one click. New leads flow into Captivly.ai automatically via real-time webhooks.",
  openGraph: {
    title: "Meta Lead Ads Integration - Captivly.ai",
    description:
      "Connect your Facebook and Instagram ad accounts in one click. Leads flow in automatically.",
    url: "https://captivly.ai/features/meta-lead-ads",
  },
};

export default function MetaLeadAdsPage() {
  return (
    <FeatureLayout
      title="Meta Lead Ads Integration"
      description="Connect your Facebook and Instagram ad accounts in one click. New leads flow into Captivly.ai automatically via real-time webhooks — no CSV exports, no manual entry, no delays."
      ctaHeading="Ready to automate your Meta leads?"
      ctaDescription="Connect your ad account in under 2 minutes and start converting leads on autopilot."
    >
      {/* How it works */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-600">
                1
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                Connect your Meta account
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Authorize Captivly.ai with one-click OAuth. We connect to your
                Facebook Business Manager and ad accounts securely.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-600">
                2
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                Leads flow in automatically
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                When someone fills out your Lead Ad form, Captivly.ai receives
                the data in real time via Meta&apos;s webhook API — within
                seconds.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-600">
                3
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                AI takes over from there
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Each lead is instantly scored by AI and enrolled into a
                personalized outreach sequence. No manual work required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            Built for local businesses
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                One-click OAuth connection
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                No developer tokens or manual configuration. Just click
                &quot;Connect Meta&quot; during onboarding and authorize
                access. Captivly.ai handles the rest.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Real-time webhook ingestion
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Leads arrive within seconds of form submission — not hours.
                This means your outreach starts while the prospect is still
                interested, dramatically increasing conversion rates.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Campaign creation from Captivly.ai
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Create and manage your Meta Lead Ad campaigns directly from
                the Captivly.ai dashboard. Set budgets, target audiences, and
                launch ads without ever leaving the platform.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Custom form field mapping
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Captivly.ai automatically captures standard fields (name, email,
                phone) plus any custom questions from your lead forms. All
                data feeds into AI scoring for better lead quality assessment.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
