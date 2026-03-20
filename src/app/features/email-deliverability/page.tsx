import Link from "next/link";
import { Logo } from "@/components/logo";

export default function EmailDeliverabilityPage() {
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
              Email Deliverability Monitoring
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Track bounce rates, spam complaints, domain reputation, and
              inbox placement in real time. If your emails aren&apos;t landing
              in the inbox, nothing else matters.
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

        {/* The problem */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              If it hits spam, it doesn&apos;t exist
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
              You can have the perfect subject line, the perfect offer, and
              the perfect sequence — but if your email lands in spam, the lead
              never sees it. Deliverability is the foundation.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-red-500">20%</div>
                <p className="mt-2 text-sm text-slate-600">
                  of legitimate marketing emails never reach the inbox.
                  One in five of your outreach messages may be invisible.
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-teal-600">0.1%</div>
                <p className="mt-2 text-sm text-slate-600">
                  spam complaint rate threshold. Go above this and email
                  providers start throttling or blocking your domain.
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-green-600">98%+</div>
                <p className="mt-2 text-sm text-slate-600">
                  deliverability rate is the target. Captivly monitors
                  continuously and alerts you before problems escalate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Health dashboard */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Deliverability health dashboard
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-sm text-slate-600">
              One view shows you everything about your email health. Green
              means good. Red means take action now.
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Delivery Rate",
                  value: "98.4%",
                  status: "green",
                  target: "Target: >97%",
                },
                {
                  label: "Bounce Rate",
                  value: "1.2%",
                  status: "green",
                  target: "Target: <3%",
                },
                {
                  label: "Spam Complaints",
                  value: "0.03%",
                  status: "green",
                  target: "Target: <0.1%",
                },
                {
                  label: "Open Rate",
                  value: "24.8%",
                  status: "green",
                  target: "Industry avg: 20%",
                },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg border bg-white p-4 text-center">
                  <p className="text-xs font-medium text-slate-500">
                    {metric.label}
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      metric.status === "green"
                        ? "text-green-600"
                        : metric.status === "yellow"
                          ? "text-yellow-600"
                          : "text-red-500"
                    }`}
                  >
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{metric.target}</p>
                </div>
              ))}
            </div>

            {/* Domain health */}
            <div className="mt-8 rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Domain health checks
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  { check: "SPF record configured", status: "pass" },
                  { check: "DKIM signing active", status: "pass" },
                  { check: "DMARC policy set", status: "pass" },
                  { check: "Domain not on blocklists", status: "pass" },
                  { check: "MX records valid", status: "pass" },
                ].map((item) => (
                  <div
                    key={item.check}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-600">{item.check}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.status === "pass"
                          ? "bg-green-100 text-green-700"
                          : item.status === "warn"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-600"
                      }`}
                    >
                      {item.status === "pass" ? "Passed" : item.status === "warn" ? "Warning" : "Failed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What we monitor */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900">
              What we monitor
            </h2>
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Bounce tracking & categorization
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Every bounce is categorized as hard (invalid address) or
                  soft (mailbox full, temporary issue). Hard bounces are
                  automatically suppressed from future sends. Soft bounces
                  are retried once, then suppressed if they persist.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Spam complaint monitoring
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  When a recipient marks your email as spam, Captivly
                  receives the feedback loop report and immediately
                  suppresses that address. Your complaint rate is tracked
                  in real time with alerts if it approaches the 0.1%
                  threshold.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Domain reputation scoring
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Captivly monitors your sending domain&apos;s reputation
                  across major email providers (Gmail, Outlook, Yahoo).
                  If your reputation starts dropping, you get an alert
                  with specific recommendations to fix it.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Authentication status
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  SPF, DKIM, and DMARC are checked continuously. If any
                  record expires, changes, or becomes invalid, you get an
                  immediate alert. Captivly also provides step-by-step
                  setup guides for each authentication method.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Blocklist monitoring
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Your sending IP and domain are checked against 50+ email
                  blocklists daily. If you appear on any list, Captivly
                  alerts you immediately and provides delisting
                  instructions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Proactive alerts
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-sm text-slate-600">
              Don&apos;t wait until your emails stop arriving. Captivly
              alerts you at the first sign of trouble.
            </p>
            <div className="mt-12 space-y-4">
              <div className="rounded-lg border bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                    <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Bounce rate rising
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      &quot;Your bounce rate increased from 1.2% to 2.8%
                      over the last 48 hours. 14 hard bounces detected.
                      These addresses have been suppressed. Review your
                      lead sources for data quality issues.&quot;
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Spam complaint threshold approaching
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      &quot;Your spam complaint rate is at 0.08%, approaching
                      the 0.1% safe threshold. Consider reviewing your
                      subject lines and ensuring leads have clear opt-in
                      consent before outreach begins.&quot;
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      DKIM record issue detected
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      &quot;Your DKIM DNS record has changed and no longer
                      matches the signing key. This will cause authentication
                      failures. Update your DNS record or contact your domain
                      provider.&quot;
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
            <h2 className="text-2xl font-bold text-slate-900">
              Make sure your emails get read
            </h2>
            <p className="mt-4 text-slate-600">
              Monitor deliverability, catch problems early, and keep your
              sender reputation clean — so every outreach email lands in
              the inbox, not the spam folder.
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
