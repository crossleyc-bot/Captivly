import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Best Time to Send Analysis",
  description:
    "AI analyzes your open rates, reply rates, and conversion patterns to find the optimal send time for every audience segment.",
  openGraph: {
    title: "Best Time to Send Analysis - Captivly.ai",
    description:
      "AI finds the optimal send time for every audience segment based on your data.",
    url: "https://captivly.ai/features/best-time-to-send",
  },
};

export default function BestTimeToSendPage() {
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
              Best Time to Send Analysis
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              AI analyzes your open rates, reply rates, and conversion patterns
              to find the optimal send time for every audience segment. Stop
              sending at &quot;best practice&quot; times — send at your
              best times.
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

        {/* Why timing matters */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Timing is everything
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
              The same message sent at 9am vs 7pm can have completely different
              results. Your audience has unique patterns — generic &quot;best
              practices&quot; don&apos;t capture that.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-teal-600">40%</div>
                <p className="mt-2 text-sm text-slate-600">
                  higher open rates when messages land during your
                  audience&apos;s peak engagement window
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-teal-600">2.1x</div>
                <p className="mt-2 text-sm text-slate-600">
                  more replies when SMS arrives at the right time vs
                  a random send window
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-green-600">$0</div>
                <p className="mt-2 text-sm text-slate-600">
                  extra cost — send time optimization is pure leverage on
                  messages you&apos;re already sending
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Heatmap visualization */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Your audience&apos;s engagement heatmap
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-sm text-slate-600">
              Captivly.ai builds a visual heatmap of when your leads are most
              likely to open, click, and reply. Here&apos;s what it looks like
              for a typical gym.
            </p>
            <div className="mt-12 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-2 pr-2 text-left font-medium">Time</th>
                    <th className="pb-2 px-1 font-medium">Mon</th>
                    <th className="pb-2 px-1 font-medium">Tue</th>
                    <th className="pb-2 px-1 font-medium">Wed</th>
                    <th className="pb-2 px-1 font-medium">Thu</th>
                    <th className="pb-2 px-1 font-medium">Fri</th>
                    <th className="pb-2 px-1 font-medium">Sat</th>
                    <th className="pb-2 px-1 font-medium">Sun</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { time: "6–8am", cells: ["bg-green-100", "bg-green-200", "bg-green-100", "bg-green-200", "bg-green-100", "bg-green-300", "bg-green-300"] },
                    { time: "8–10am", cells: ["bg-green-200", "bg-green-300", "bg-green-200", "bg-green-300", "bg-green-200", "bg-green-400", "bg-green-400"] },
                    { time: "10–12pm", cells: ["bg-slate-100", "bg-slate-100", "bg-slate-100", "bg-slate-100", "bg-slate-100", "bg-green-200", "bg-green-200"] },
                    { time: "12–2pm", cells: ["bg-green-200", "bg-green-200", "bg-green-300", "bg-green-200", "bg-green-200", "bg-slate-100", "bg-slate-100"] },
                    { time: "2–4pm", cells: ["bg-slate-100", "bg-slate-100", "bg-slate-100", "bg-slate-100", "bg-slate-100", "bg-slate-100", "bg-slate-100"] },
                    { time: "4–6pm", cells: ["bg-green-200", "bg-green-300", "bg-green-200", "bg-green-300", "bg-green-400", "bg-slate-100", "bg-slate-100"] },
                    { time: "6–8pm", cells: ["bg-green-300", "bg-green-400", "bg-green-300", "bg-green-400", "bg-green-300", "bg-slate-100", "bg-slate-100"] },
                    { time: "8–10pm", cells: ["bg-green-200", "bg-green-200", "bg-green-200", "bg-green-200", "bg-green-100", "bg-slate-100", "bg-slate-100"] },
                  ].map((row) => (
                    <tr key={row.time}>
                      <td className="py-1 pr-2 font-medium text-slate-600">
                        {row.time}
                      </td>
                      {row.cells.map((cell, i) => (
                        <td key={i} className="px-1 py-1">
                          <div
                            className={`h-8 rounded ${cell}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-slate-100" />
                  <span className="text-xs text-slate-500">Low</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-green-200" />
                  <span className="text-xs text-slate-500">Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-green-400" />
                  <span className="text-xs text-slate-500">High</span>
                </div>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-slate-400">
              Example: This gym&apos;s leads are most responsive on
              weekday evenings (6–8pm) and weekend mornings (8–10am).
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              How it works
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-4">
              {[
                {
                  step: "1",
                  title: "Collect data",
                  description:
                    "Captivly.ai tracks open times, click times, and reply times for every message sent across all your sequences.",
                },
                {
                  step: "2",
                  title: "AI analyzes",
                  description:
                    "After enough data (typically 2–4 weeks), AI identifies statistically significant engagement patterns.",
                },
                {
                  step: "3",
                  title: "Recommend",
                  description:
                    "You get specific recommendations: \"Send email step 1 at 6:30pm on weekdays\" with confidence scores.",
                },
                {
                  step: "4",
                  title: "Auto-optimize",
                  description:
                    "Enable auto-optimization and Captivly.ai adjusts send times for future sequences automatically.",
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

        {/* Features */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Send time features
            </h2>
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Per-channel analysis
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Optimal send times differ by channel. Your audience might
                  open emails at 8am but reply to SMS at 6pm. Captivly.ai
                  analyzes each channel independently.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Source-segment analysis
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Meta leads and Google leads may have different peak
                  engagement times. Captivly.ai segments the analysis by lead
                  source so each group gets messages at their ideal time.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Timezone awareness
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  If you serve customers across multiple timezones, Captivly.ai
                  detects the lead&apos;s timezone from their area code or
                  location data and adjusts send times accordingly.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Continuous learning
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Send time recommendations improve over time as more data
                  comes in. Seasonal patterns, day-of-week shifts, and
                  audience changes are all factored in automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-white px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Send smarter, not more
            </h2>
            <p className="mt-4 text-slate-600">
              The same messages, sent at the right time, convert dramatically
              better. Let AI find your audience&apos;s sweet spot.
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
