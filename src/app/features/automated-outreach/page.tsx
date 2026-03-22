import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AutomatedOutreachPage() {
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
              Automated Outreach Sequences
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              AI writes personalized multi-step email and SMS sequences for
              every lead. The right message, to the right person, at the right
              time — completely hands-free.
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

        {/* Example sequence */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              A typical 5-step sequence
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
              Here&apos;s how a gym promoting a free 7-day trial might engage a
              new lead over 14 days.
            </p>
            <div className="mt-12 space-y-4">
              {[
                {
                  step: 1,
                  day: "Day 0",
                  channel: "Email",
                  description:
                    "Welcome email with the free trial offer and a warm introduction to the gym.",
                },
                {
                  step: 2,
                  day: "Day 1",
                  channel: "SMS",
                  description:
                    "Quick text: \"Hey {name}, your free trial is waiting! Reply YES to book your first visit.\"",
                },
                {
                  step: 3,
                  day: "Day 3",
                  channel: "Email",
                  description:
                    "Social proof email with member success stories and a reminder about the trial.",
                },
                {
                  step: 4,
                  day: "Day 7",
                  channel: "SMS",
                  description:
                    "Gentle nudge: \"Still thinking about it? Your free trial expires soon — don't miss out!\"",
                },
                {
                  step: 5,
                  day: "Day 14",
                  channel: "Email",
                  description:
                    "Final email with a limited-time bonus offer to create urgency.",
                },
              ].map((step) => (
                <div
                  key={step.step}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-600">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {step.day}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          step.channel === "Email"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {step.channel}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Sequence capabilities
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  AI-generated content
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Claude AI writes every email and SMS based on your business
                  type, offer, and preferred tone. Each message is unique and
                  personalized to the lead.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Email + SMS combined
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Alternate between email and SMS for maximum engagement.
                  Starter plans get 3-step email-only sequences; Growth and Pro
                  unlock 5-step email + SMS.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Automatic scheduling
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Messages are queued and sent automatically at the right
                  intervals. A scheduler checks every hour and fires messages
                  that are due.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Reply detection
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  When a lead replies to an email or SMS, the sequence
                  automatically pauses so you can take over the conversation
                  personally.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Plan comparison */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Sequence features by plan
            </h2>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-500">
                    <th className="pb-2 pr-4">Feature</th>
                    <th className="pb-2 pr-4">Starter</th>
                    <th className="pb-2 pr-4">Growth</th>
                    <th className="pb-2">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      Sequence steps
                    </td>
                    <td className="py-3 pr-4 text-slate-600">3</td>
                    <td className="py-3 pr-4 text-slate-600">5</td>
                    <td className="py-3 text-slate-600">5</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      Email outreach
                    </td>
                    <td className="py-3 pr-4 text-green-600">Included</td>
                    <td className="py-3 pr-4 text-green-600">Included</td>
                    <td className="py-3 text-green-600">Included</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      SMS outreach
                    </td>
                    <td className="py-3 pr-4 text-slate-400">—</td>
                    <td className="py-3 pr-4 text-green-600">500/mo</td>
                    <td className="py-3 text-green-600">2,000/mo</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      Reply detection
                    </td>
                    <td className="py-3 pr-4 text-green-600">Included</td>
                    <td className="py-3 pr-4 text-green-600">Included</td>
                    <td className="py-3 text-green-600">Included</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-slate-50 px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Put your outreach on autopilot
            </h2>
            <p className="mt-4 text-slate-600">
              Stop manually following up with leads. Let AI handle the
              outreach while you run your business.
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
