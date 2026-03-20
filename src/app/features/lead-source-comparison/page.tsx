import Link from "next/link";
import { Logo } from "@/components/logo";

export default function LeadSourceComparisonPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link href="/">
          <Logo size={24} />
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-indigo-50 via-white to-white px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="mb-4 inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-semibold text-indigo-700">
              Intelligence & Reporting
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Lead Source Comparison
            </h1>
            <p className="mt-6 text-lg text-zinc-600">
              Side-by-side performance of Meta vs Google vs organic leads.
              See which channels deliver the highest-quality leads at the
              lowest cost — and shift your budget accordingly.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
              >
                Start Free Trial
              </Link>
              <Link
                href="/#features"
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                All Features
              </Link>
            </div>
          </div>
        </section>

        {/* The problem */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              Not all leads are created equal
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-zinc-600">
              A lead from a Google search for &quot;best dentist near me&quot;
              behaves differently than one who clicked a Facebook ad while
              scrolling. Treating them the same wastes money.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border p-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
                  </svg>
                  <span className="text-sm font-semibold text-zinc-900">Meta</span>
                </div>
                <p className="mt-3 text-sm text-zinc-600">
                  High volume, audience-targeted. Great for awareness and
                  impulse-driven offers like free trials and flash discounts.
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
                  </svg>
                  <span className="text-sm font-semibold text-zinc-900">Google</span>
                </div>
                <p className="mt-3 text-sm text-zinc-600">
                  High intent, search-driven. Leads are actively looking for
                  your service. Typically higher quality, higher cost.
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.732-3.558" />
                  </svg>
                  <span className="text-sm font-semibold text-zinc-900">Organic</span>
                </div>
                <p className="mt-3 text-sm text-zinc-600">
                  Free, referral or walk-in traffic. Often the
                  highest-converting leads since they found you on their own.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Example dashboard */}
        <section className="border-t bg-zinc-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              Compare everything in one view
            </h2>
            <div className="mt-12 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-zinc-500">
                    <th className="pb-3 pr-4">Metric</th>
                    <th className="pb-3 pr-4">
                      <span className="text-[#1877F2]">Meta</span>
                    </th>
                    <th className="pb-3 pr-4">
                      <span className="text-[#4285F4]">Google</span>
                    </th>
                    <th className="pb-3 pr-4">
                      <span className="text-green-600">Organic</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { metric: "Leads this month", meta: "182", google: "94", organic: "31" },
                    { metric: "Avg. AI score", meta: "5.8", google: "7.4", organic: "8.1" },
                    { metric: "Conversion rate", meta: "12%", google: "22%", organic: "35%" },
                    { metric: "Avg. time to reply", meta: "4.2 hrs", google: "1.8 hrs", organic: "6.1 hrs" },
                    { metric: "Cost per lead", meta: "$8.50", google: "$14.20", organic: "$0" },
                    { metric: "Cost per conversion", meta: "$70.83", google: "$64.55", organic: "$0" },
                    { metric: "Revenue generated", meta: "$6,370", google: "$8,460", organic: "$4,185" },
                    { metric: "ROI", meta: "3.1x", google: "4.3x", organic: "—" },
                  ].map((row) => (
                    <tr key={row.metric} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-zinc-900">
                        {row.metric}
                      </td>
                      <td className="py-3 pr-4 text-zinc-600">{row.meta}</td>
                      <td className="py-3 pr-4 text-zinc-600">{row.google}</td>
                      <td className="py-3 pr-4 text-zinc-600">{row.organic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-center text-xs text-zinc-400">
              Example data for a gym running campaigns on both platforms.
              Google leads cost more but convert at nearly 2x the rate.
            </p>
          </div>
        </section>

        {/* What you can compare */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-zinc-900">
              What you can compare
            </h2>
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Lead quality by source
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Compare average AI scores across sources. If Google leads
                  consistently score 7+ while Meta leads average 5, you know
                  where your highest-quality prospects come from.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Conversion funnel by source
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  See the full funnel for each source: leads → replied →
                  converted. Identify where each channel drops off. Maybe
                  Meta leads reply but don&apos;t convert — that&apos;s a
                  sequence problem, not a traffic problem.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Cost efficiency
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Compare cost per lead and cost per conversion across
                  platforms. A $15 Google lead that converts at 22% is
                  cheaper per customer than a $9 Meta lead that converts
                  at 12%.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Revenue attribution by source
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  When paired with revenue tracking, see total revenue and
                  ROI per source. Know exactly which platform puts the most
                  money in your pocket — not just the most leads in your
                  pipeline.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Engagement patterns
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Compare open rates, reply rates, and time-to-reply across
                  sources. Google leads might reply faster because they&apos;re
                  actively searching. Meta leads might need more nurturing
                  touches.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI insights */}
        <section className="border-t bg-zinc-50 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              AI-powered insights
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-zinc-600">
              Captivly doesn&apos;t just show you the data — it tells you
              what to do about it.
            </p>
            <div className="mt-12 space-y-4">
              <div className="rounded-lg border bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      Budget recommendation
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      &quot;Your Google leads convert at 22% vs Meta&apos;s 12%,
                      with a lower cost per conversion ($64.55 vs $70.83).
                      Consider shifting 20% of your Meta budget to Google
                      Search campaigns.&quot;
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      Sequence optimization
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      &quot;Meta leads reply 2.3x slower than Google leads.
                      Try adding an extra nurturing step to your Meta
                      sequences — a value-driven email on Day 2 before the
                      main offer on Day 3.&quot;
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      Organic growth opportunity
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      &quot;Your 31 organic leads convert at 35% — your
                      highest rate. Consider investing in Google Business
                      Profile optimization and review generation to increase
                      organic lead volume.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-white px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-zinc-900">
              Stop guessing. Start comparing.
            </h2>
            <p className="mt-4 text-zinc-600">
              Every dollar you spend on ads should be measured against results.
              See which channels actually work for your business.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} Captivly. All rights reserved.
      </footer>
    </div>
  );
}
