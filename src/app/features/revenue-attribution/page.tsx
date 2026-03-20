import Link from "next/link";
import { Logo } from "@/components/logo";

export default function RevenueAttributionPage() {
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
              Revenue Attribution
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Track the actual dollar value from lead to paying customer. Know
              exactly how much revenue each campaign, ad, and sequence is
              generating — not just conversion counts.
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

        {/* Why it matters */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Conversions are good. Revenue is better.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
              Knowing that a campaign generated 50 conversions is useful.
              Knowing it generated $12,400 in revenue is powerful.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-500">
                  Without revenue attribution
                </h3>
                <ul className="mt-4 space-y-3">
                  {[
                    "Campaign A: 30 conversions",
                    "Campaign B: 50 conversions",
                    "Which is better? B, right?",
                    "...actually, you don't know",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="text-slate-400">-</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-6">
                <h3 className="text-sm font-semibold text-teal-700">
                  With revenue attribution
                </h3>
                <ul className="mt-4 space-y-3">
                  {[
                    "Campaign A: 30 conversions → $15,000",
                    "Campaign B: 50 conversions → $8,500",
                    "A generates 1.8x more revenue",
                    "Double down on A, optimize B",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* What you can track */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900">
              What you can track
            </h2>
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Revenue per lead
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Assign a dollar value when a lead converts — whether
                  it&apos;s a membership signup, a service booked, or a
                  product purchased. See the lifetime value of every lead in
                  your dashboard.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Revenue per campaign
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  See total revenue generated by each campaign alongside ad
                  spend. Calculate true ROI instantly — not vanity metrics
                  like impressions or clicks, but actual money in the door.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Revenue per sequence
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Compare which outreach sequences generate the most revenue.
                  A/B test different offers and messaging to find what converts
                  highest-value customers.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Cost per acquisition (CPA)
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  With ad spend and revenue data in one place, Captivly
                  calculates your true cost per paying customer. Know exactly
                  how much it costs to acquire each customer.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Monthly revenue trends
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Track how your lead-generated revenue grows month over
                  month. See the direct impact of your ad campaigns and
                  outreach on your bottom line.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard metrics */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Revenue metrics at a glance
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total Revenue",
                  value: "$24,800",
                  subtext: "This month",
                },
                {
                  label: "Avg. Lead Value",
                  value: "$248",
                  subtext: "Per converted lead",
                },
                {
                  label: "Campaign ROI",
                  value: "4.2x",
                  subtext: "Revenue vs ad spend",
                },
                {
                  label: "CPA",
                  value: "$18.50",
                  subtext: "Cost per acquisition",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border p-4 text-center"
                >
                  <p className="text-xs font-medium text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {metric.subtext}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to log revenue */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              How to log revenue
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Manual entry",
                  description:
                    "Click any converted lead and add the revenue amount. Quick and simple for businesses with a few conversions per day.",
                },
                {
                  step: "2",
                  title: "Booking webhook",
                  description:
                    "If you use the booking integration, Captivly can pull the service value automatically when an appointment is confirmed.",
                },
                {
                  step: "3",
                  title: "Zapier / API",
                  description:
                    "Connect your POS or CRM via Zapier to push revenue data into Captivly automatically as sales close.",
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

        {/* CTA */}
        <section className="border-t bg-white px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Know what your leads are worth
            </h2>
            <p className="mt-4 text-slate-600">
              Stop guessing which campaigns work. Start tracking real revenue
              from every lead.
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
