import Link from "next/link";
import { Logo } from "@/components/logo";

export default function CompliancePage() {
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
              Trust & Compliance
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              TCPA & GDPR Compliance
            </h1>
            <p className="mt-6 text-lg text-zinc-600">
              Opt-in tracking, consent management, and auto-unsubscribe built
              into every message. Stay compliant without thinking about it —
              Captivly handles the legal details so you can focus on leads.
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

        {/* Why compliance matters */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              Compliance isn&apos;t optional
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-zinc-600">
              Sending marketing messages without proper consent can result in
              massive fines. TCPA violations cost $500–$1,500 per message.
              GDPR fines reach up to 4% of annual revenue.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-6 text-center">
                <div className="text-3xl font-bold text-red-600">$1,500</div>
                <p className="mt-2 text-sm text-zinc-600">
                  maximum TCPA penalty per unsolicited text message. A batch
                  of 100 texts could mean $150,000 in fines.
                </p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-6 text-center">
                <div className="text-3xl font-bold text-red-600">4%</div>
                <p className="mt-2 text-sm text-zinc-600">
                  of annual global revenue — the maximum GDPR fine for
                  non-compliance with data protection rules.
                </p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50/50 p-6 text-center">
                <div className="text-3xl font-bold text-green-600">100%</div>
                <p className="mt-2 text-sm text-zinc-600">
                  of outbound messages through Captivly are compliance-checked
                  before sending. Automatic, not optional.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TCPA */}
        <section className="border-t bg-zinc-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-zinc-900">
              TCPA compliance (US)
            </h2>
            <p className="mt-4 text-sm text-zinc-600">
              The Telephone Consumer Protection Act regulates SMS and phone
              outreach. Captivly ensures you stay on the right side of it.
            </p>
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Prior express written consent tracking
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  When a lead submits a Meta or Google lead form, their
                  consent is captured and timestamped automatically.
                  Captivly stores the exact form they filled out, when they
                  submitted it, and what they consented to — creating a
                  defensible audit trail.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Automatic opt-out handling
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  If a lead replies &quot;STOP&quot;, &quot;UNSUBSCRIBE&quot;,
                  &quot;CANCEL&quot;, or any recognized opt-out keyword to an
                  SMS, Captivly immediately stops all outreach, marks them as
                  unsubscribed, and sends a confirmation message. No human
                  action needed.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Quiet hours enforcement
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  TCPA prohibits marketing calls/texts before 8am and after
                  9pm in the recipient&apos;s local timezone. Captivly
                  detects the lead&apos;s timezone and holds messages until
                  the next allowed window — automatically.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  DNC list checking
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Before sending any SMS, Captivly checks the number against
                  your internal Do Not Contact list. Numbers that have opted
                  out are blocked permanently unless they explicitly re-opt-in.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* GDPR */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-zinc-900">
              GDPR compliance (EU/UK)
            </h2>
            <p className="mt-4 text-sm text-zinc-600">
              If you serve customers in the EU or UK, GDPR applies.
              Captivly provides the tools you need to stay compliant.
            </p>
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Lawful basis tracking
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Every lead has a recorded lawful basis for processing —
                  typically &quot;consent&quot; from the ad form submission.
                  This is stored alongside the lead record and visible in
                  the lead detail view.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Right to erasure
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  When a lead requests their data be deleted, one click
                  removes all personal data from Captivly — lead record,
                  messages, scores, and custom answers. An anonymized
                  record is kept for analytics only.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Right to access
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Export all data Captivly holds about a specific lead in
                  a machine-readable format (JSON or CSV). Fulfill data
                  subject access requests (DSARs) in minutes, not days.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Data retention policies
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Configure how long lead data is retained. Auto-delete
                  or anonymize leads after 6, 12, or 24 months of
                  inactivity. Set it once, Captivly enforces it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Consent management */}
        <section className="border-t bg-zinc-50 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              Consent management dashboard
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-sm text-zinc-600">
              See the consent status of every lead at a glance. Filter by
              status, export for audits, and manage preferences centrally.
            </p>
            <div className="mt-12 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-zinc-500">
                    <th className="pb-3 pr-4">Lead</th>
                    <th className="pb-3 pr-4">Email consent</th>
                    <th className="pb-3 pr-4">SMS consent</th>
                    <th className="pb-3 pr-4">Source</th>
                    <th className="pb-3 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Sarah J.", email: "Opted in", sms: "Opted in", source: "Meta lead form", date: "Mar 18, 2026" },
                    { name: "Mike R.", email: "Opted in", sms: "Opted out", source: "Meta lead form", date: "Mar 17, 2026" },
                    { name: "Lisa K.", email: "Opted in", sms: "Opted in", source: "Google lead form", date: "Mar 16, 2026" },
                    { name: "Tom H.", email: "Unsubscribed", sms: "Opted out", source: "Meta lead form", date: "Mar 14, 2026" },
                  ].map((row) => (
                    <tr key={row.name} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-zinc-900">
                        {row.name}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.email === "Opted in"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {row.email}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.sms === "Opted in"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {row.sms}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-zinc-600">{row.source}</td>
                      <td className="py-3 pr-4 text-zinc-500">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Email compliance */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-zinc-900">
              Email compliance (CAN-SPAM)
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Unsubscribe link in every email
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Every outreach email includes a one-click unsubscribe link.
                  Required by CAN-SPAM and automatically included — you
                  can&apos;t accidentally send without one.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Physical address included
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  CAN-SPAM requires a valid physical address in marketing
                  emails. Captivly pulls your business address from your
                  profile and includes it in every email footer.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Instant unsubscribe processing
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  When someone clicks unsubscribe, they&apos;re removed
                  immediately — not within 10 business days. All queued
                  emails are cancelled and the lead is marked as
                  unsubscribed.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Honest subject lines
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  AI-generated subject lines are reviewed against CAN-SPAM
                  guidelines. No deceptive subjects, no misleading
                  &quot;Re:&quot; or &quot;Fwd:&quot; prefixes — just honest
                  outreach that builds trust.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-zinc-50 px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-zinc-900">
              Compliant by default
            </h2>
            <p className="mt-4 text-zinc-600">
              TCPA, GDPR, CAN-SPAM — Captivly handles the legal requirements
              automatically. Send with confidence, not anxiety.
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
