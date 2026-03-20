import Link from "next/link";
import { Logo } from "@/components/logo";

export default function MetaLeadAdsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link href="/">
          <Logo size={24} />
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-teal-50 via-white to-white px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="mb-4 inline-block rounded-full bg-amber-100 px-4 py-1.5 text-xs font-semibold text-amber-700">
              Integration
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Meta Lead Ads Integration
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Connect your Facebook and Instagram ad accounts in one click. New
              leads flow into Captivly automatically via real-time webhooks — no
              CSV exports, no manual entry, no delays.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-amber-200 hover:bg-teal-700"
              >
                Start Free Trial
              </Link>
              <Link
                href="/#features"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                All Features
              </Link>
            </div>
          </div>
        </section>

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
                  Authorize Captivly with one-click OAuth. We connect to your
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
                  When someone fills out your Lead Ad form, Captivly receives
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
                  access. Captivly handles the rest.
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
                  Campaign creation from Captivly
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Create and manage your Meta Lead Ad campaigns directly from
                  the Captivly dashboard. Set budgets, target audiences, and
                  launch ads without ever leaving the platform.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Custom form field mapping
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Captivly automatically captures standard fields (name, email,
                  phone) plus any custom questions from your lead forms. All
                  data feeds into AI scoring for better lead quality assessment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-white px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Ready to automate your Meta leads?
            </h2>
            <p className="mt-4 text-slate-600">
              Connect your ad account in under 2 minutes and start converting
              leads on autopilot.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-amber-200 hover:bg-teal-700"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Captivly. All rights reserved.
      </footer>
    </div>
  );
}
