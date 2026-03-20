import Link from "next/link";
import { Logo } from "@/components/logo";

export default function GoogleAdsPage() {
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
              Channels & Reach
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Google Ads Lead Form Integration
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Capture leads from Google Search and YouTube ads with lead form
              extensions. Leads flow into Captivly in real time — scored,
              sequenced, and followed up automatically.
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

        {/* Why Google Ads */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Meet customers where they&apos;re already searching
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
              Meta ads reach people scrolling. Google ads reach people actively
              searching for your service right now. Both matter — and Captivly
              handles both.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-teal-600">8.5B</div>
                <p className="mt-2 text-sm text-slate-600">
                  Google searches per day — your customers are searching for
                  businesses like yours right now
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-teal-600">2–5x</div>
                <p className="mt-2 text-sm text-slate-600">
                  higher intent than social media leads — they searched for
                  &quot;gym near me&quot;, not just scrolled past an ad
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-green-600">30%</div>
                <p className="mt-2 text-sm text-slate-600">
                  more leads when using lead form extensions vs sending
                  traffic to a landing page
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
                  title: "Connect Google Ads",
                  description:
                    "OAuth into your Google Ads account from Captivly settings. One click, no API keys to copy.",
                },
                {
                  step: "2",
                  title: "Lead form submits",
                  description:
                    "A customer searches, clicks your ad, fills out the lead form — all without leaving Google.",
                },
                {
                  step: "3",
                  title: "Instant ingestion",
                  description:
                    "Captivly receives the lead via webhook within seconds. AI scores it and generates a personalized sequence.",
                },
                {
                  step: "4",
                  title: "Outreach fires",
                  description:
                    "Email and SMS sequence starts automatically. The lead hears from you within a minute of submitting.",
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

        {/* Google + Meta side by side */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              One dashboard, two ad platforms
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
              Run Meta and Google ads simultaneously. All leads land in the
              same pipeline — scored, sequenced, and tracked side by side.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-[#4285F4]/10">
                    <svg className="h-5 w-5 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Google Ads
                  </h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {[
                    "Search ad lead forms",
                    "YouTube ad lead forms",
                    "Display network lead forms",
                    "High-intent keyword targeting",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <svg
                        className="h-4 w-4 shrink-0 text-green-600"
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
              <div className="rounded-lg border p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1877F2]/10">
                    <svg className="h-5 w-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Meta Lead Ads
                  </h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {[
                    "Facebook lead forms",
                    "Instagram lead forms",
                    "Audience-based targeting",
                    "Lookalike audiences",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <svg
                        className="h-4 w-4 shrink-0 text-green-600"
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

        {/* Features */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Google Ads features
            </h2>
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Real-time lead delivery
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Google sends leads to Captivly via Pub/Sub webhook the
                  moment a form is submitted. No polling, no delays. Your AI
                  follow-up starts within seconds.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Cross-platform lead scoring
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  AI scoring works the same for Google and Meta leads. The
                  source is factored in — a lead who searched &quot;personal
                  trainer near me&quot; scores differently than one who
                  clicked a Facebook ad while scrolling.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Unified campaign analytics
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Compare Google vs Meta performance in one view. See which
                  platform delivers better leads, higher conversion rates,
                  and lower cost per acquisition for your specific business.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Source-aware sequences
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  AI tailors outreach based on the lead source. A Google
                  Search lead who typed &quot;best gym in Austin&quot; gets a
                  different opening message than a Meta lead who saw a
                  promotional video.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-white px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Capture leads from every search
            </h2>
            <p className="mt-4 text-slate-600">
              Your customers are Googling your service right now. Connect
              Google Ads and start turning searches into customers.
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
