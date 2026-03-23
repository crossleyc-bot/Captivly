import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "Data Export & Portability",
  description:
    "Export leads, messages, analytics, and campaign history anytime in CSV or JSON. No lock-in, no export fees.",
  openGraph: {
    title: "Data Export & Portability - Captivly.ai",
    description:
      "Export your leads, messages, and analytics anytime in CSV or JSON.",
    url: "https://captivly.ai/features/data-export",
  },
};

export default function DataExportPage() {
  return (
    <FeatureLayout
      title="Data Export & Portability"
      description="Your data is your data. Export leads, messages, analytics, and campaign history anytime in CSV or JSON. No lock-in, no hostage data, no export fees."
      ctaHeading="Your data, always accessible"
      ctaDescription="Export anything, anytime, in the format you need. No lock-in, no export fees, no hoops to jump through."
    >
      {/* Philosophy */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            No data hostages
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
            Some platforms make it impossible to leave by trapping your
            data. Captivly.ai believes the opposite — you should stay because
            the product is good, not because your data is locked in.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">$0</div>
              <p className="mt-2 text-sm text-slate-600">
                export fees, ever. Your data is free to download on any
                plan, anytime, with no limits.
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">2</div>
              <p className="mt-2 text-sm text-slate-600">
                formats available — CSV for spreadsheets and simple tools,
                JSON for developers and custom integrations.
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-green-600">All</div>
              <p className="mt-2 text-sm text-slate-600">
                data included. Leads, messages, scores, sequences,
                campaigns, analytics — everything you put in, you get out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What you can export */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            What you can export
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Leads
                </h3>
                <div className="flex gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                    .csv
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                    .json
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                All lead data: name, email, phone, source, campaign, AI
                score, score reason, status, custom form answers, created
                date, and updated date. Filter by date range, campaign,
                status, or score before exporting.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Messages
                </h3>
                <div className="flex gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                    .csv
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                    .json
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Every message sent through Captivly.ai: channel (email/SMS),
                recipient, subject, body, status (queued, sent, delivered,
                failed, replied), timestamps, and the sequence step it
                belongs to.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Campaigns
                </h3>
                <div className="flex gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                    .csv
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                    .json
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Campaign details including name, status, platform (Meta or
                Google), budget, total spend, lead count, conversion count,
                and all associated sequence configurations.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Analytics & conversions
                </h3>
                <div className="flex gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                    .csv
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                    .json
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Conversion records with lead ID, conversion type, revenue
                amount, notes, and date. Monthly usage data including lead
                counts, message counts, and SMS usage per month.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Full account export
                </h3>
                <div className="flex gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                    .zip
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Download everything at once — a single ZIP file containing
                all leads, messages, campaigns, sequences, conversions, and
                analytics in JSON format. Complete data portability in one
                click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to export */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            How to export
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Choose data",
                description:
                  "Go to Settings → Data Export. Select what you want: leads, messages, campaigns, or everything.",
              },
              {
                step: "2",
                title: "Apply filters",
                description:
                  "Optionally filter by date range, campaign, lead status, or other criteria. Or export it all.",
              },
              {
                step: "3",
                title: "Download",
                description:
                  "Pick CSV or JSON format and click Export. For large exports, you'll get an email when the file is ready.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
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

      {/* Use cases */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            Why people export
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Accountant / tax season
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Export conversion and revenue data to share with your
                accountant. Clean CSV format that opens directly in Excel
                or Google Sheets.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                CRM migration
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Moving to (or from) another tool? Export your complete lead
                database with all history and import it wherever you go.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Custom reporting
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Pull raw data into your own analytics tools for custom
                reports, pivot tables, or dashboards that go beyond what
                Captivly.ai&apos;s built-in analytics show.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                GDPR compliance
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Fulfill data subject access requests by exporting all data
                related to a specific lead. Machine-readable format as
                required by GDPR Article 20.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scheduled exports */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Scheduled exports
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm text-slate-600">
            Set up automatic exports on a schedule. Get a fresh CSV of your
            leads delivered to your email every week or month — no manual
            downloads needed.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <h3 className="text-sm font-semibold text-slate-900">
                Weekly
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Every Monday at 8am, receive a CSV of the previous
                week&apos;s leads and conversions.
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <h3 className="text-sm font-semibold text-slate-900">
                Monthly
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                On the 1st of each month, receive a full export of the
                previous month&apos;s activity.
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <h3 className="text-sm font-semibold text-slate-900">
                Custom
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Set your own schedule — daily, bi-weekly, or any interval
                that works for your workflow.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
