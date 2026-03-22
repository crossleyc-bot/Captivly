import Link from "next/link";
import { Logo } from "@/components/logo";

export default function WebhookApiPage() {
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
              Webhook & API
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Push leads to your own CRM, POS, or custom system in real time.
              A simple REST API and configurable webhooks for power users who
              need Captivly.ai data flowing into their existing stack.
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

        {/* Two approaches */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Two ways to integrate
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border p-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                    <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Webhooks (push)
                  </h3>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Captivly.ai sends data to your endpoint whenever an event
                  occurs. Real-time, no polling. Configure which events
                  trigger a webhook and where the payload goes.
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "New lead received",
                    "Lead score updated",
                    "Lead status changed",
                    "Message sent/delivered/replied",
                    "Conversion recorded",
                  ].map((event) => (
                    <li
                      key={event}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {event}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border p-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                    <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    REST API (pull)
                  </h3>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Query Captivly.ai data on demand. List leads, get lead
                  details, update statuses, log conversions, and more.
                  Authenticated with API keys, rate-limited, fully
                  documented.
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "GET /api/v1/leads",
                    "GET /api/v1/leads/:id",
                    "PATCH /api/v1/leads/:id",
                    "POST /api/v1/conversions",
                    "GET /api/v1/campaigns",
                  ].map((endpoint) => (
                    <li
                      key={endpoint}
                      className="text-sm font-mono text-slate-600"
                    >
                      {endpoint}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Webhook payload example */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Example webhook payload
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-sm text-slate-600">
              When a new lead arrives, Captivly.ai sends a POST request to your
              configured URL with the full lead data.
            </p>
            <div className="mt-12 overflow-x-auto rounded-lg border bg-slate-900 p-6">
              <pre className="text-sm text-slate-100">
                <code>{`{
  "event": "lead.created",
  "timestamp": "2026-03-20T14:32:00Z",
  "data": {
    "id": "lead_8f3a2b1c",
    "campaign_id": "camp_4d5e6f",
    "source": "meta",
    "first_name": "Sarah",
    "last_name": "Johnson",
    "email": "sarah@example.com",
    "phone": "+15125550123",
    "ai_score": 8,
    "ai_score_reason": "High intent, local, matches target demo",
    "status": "new",
    "custom_answers": {
      "goal": "Weight loss",
      "preferred_time": "Morning"
    },
    "created_at": "2026-03-20T14:32:00Z"
  }
}`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Common integrations
            </h2>
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  CRM sync
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Push every new lead to Salesforce, HubSpot, or your custom
                  CRM. Keep your existing workflow while Captivly.ai handles the
                  automated outreach. Lead statuses sync both directions.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  POS integration
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  When a lead converts and makes a purchase, push the
                  transaction from your POS back to Captivly.ai for revenue
                  attribution. See the full journey from ad click to dollar
                  earned.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Custom dashboards
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Pull Captivly.ai data into your own analytics tools —
                  Google Sheets, Looker, Tableau, or a custom dashboard.
                  Build the exact reports your business needs.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Member management systems
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Gyms, studios, and salons often have member management
                  software. When a lead converts, automatically create a
                  member record in your system — no double data entry.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Slack / Teams notifications
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Send webhook events to a Slack channel. Get a notification
                  whenever a high-score lead arrives, a conversion is logged,
                  or a lead replies to an outreach message.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* API key management */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Security & management
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  API key management
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Create, rotate, and revoke API keys from Settings. Each key
                  can have scoped permissions — read-only keys for dashboards,
                  write keys for CRM sync.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Webhook signatures
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Every webhook request includes an HMAC signature so you can
                  verify it came from Captivly.ai. Prevent spoofed requests from
                  corrupting your data.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Retry & logging
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Failed webhook deliveries are retried automatically with
                  exponential backoff. See delivery logs, response codes, and
                  payloads in your webhook dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Rate limits */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              API limits by plan
            </h2>
            <div className="mt-12 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-500">
                    <th className="pb-3 pr-4">Plan</th>
                    <th className="pb-3 pr-4">API requests/hour</th>
                    <th className="pb-3 pr-4">Webhooks</th>
                    <th className="pb-3 pr-4">API keys</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      Starter
                    </td>
                    <td className="py-3 pr-4 text-slate-600">100</td>
                    <td className="py-3 pr-4 text-slate-600">1 endpoint</td>
                    <td className="py-3 pr-4 text-slate-600">1 key</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      Growth
                    </td>
                    <td className="py-3 pr-4 text-slate-600">1,000</td>
                    <td className="py-3 pr-4 text-slate-600">5 endpoints</td>
                    <td className="py-3 pr-4 text-slate-600">5 keys</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      Pro
                    </td>
                    <td className="py-3 pr-4 text-slate-600">10,000</td>
                    <td className="py-3 pr-4 text-slate-600">Unlimited</td>
                    <td className="py-3 pr-4 text-slate-600">Unlimited</td>
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
              Connect Captivly.ai to anything
            </h2>
            <p className="mt-4 text-slate-600">
              Your CRM, your POS, your custom tools. Webhooks and API give
              you full control over how Captivly.ai data flows through your
              business.
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
