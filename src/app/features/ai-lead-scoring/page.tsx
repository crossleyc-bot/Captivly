import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AILeadScoringPage() {
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
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              AI Lead Scoring
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Every lead is instantly scored 1–10 by AI based on fit with your
              ideal customer profile. Stop wasting time on cold leads — focus on
              the ones most likely to convert.
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

        {/* CTA */}
        <section className="border-t bg-white px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Let AI find your best leads
            </h2>
            <p className="mt-4 text-slate-600">
              AI lead scoring is included on every plan. Sign up and start
              scoring leads instantly.
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
        &copy; {new Date().getFullYear()} Captivly.ai. All rights reserved.
      </footer>
    </div>
  );
}
