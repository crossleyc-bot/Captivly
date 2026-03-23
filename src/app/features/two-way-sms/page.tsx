import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "Two-Way SMS Conversations",
  description:
    "When a lead replies to your SMS, see it instantly in your dashboard and respond right there. No switching to your phone.",
  openGraph: {
    title: "Two-Way SMS Conversations - Captivly.ai",
    description:
      "See and respond to lead SMS replies directly from your dashboard.",
    url: "https://captivly.ai/features/two-way-sms",
  },
};

export default function TwoWaySmsPage() {
  return (
    <FeatureLayout
      title="Two-Way SMS Conversations"
      description="Go beyond one-way messaging. When a lead replies to your SMS, see it instantly in your dashboard and respond right there — no switching to your phone needed."
      ctaHeading="Have real conversations with your leads"
      ctaDescription="Two-way SMS is available on the Growth and Pro plans. Start converting more leads through personal, timely text conversations."
    >
      {/* Conversation preview */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Real conversations, right in your dashboard
          </h2>
          <div className="mt-12 rounded-lg border p-6">
            <div className="space-y-4">
              {[
                {
                  from: "you",
                  text: "Hey Sarah! Your free 7-day gym trial is ready. Reply YES to book your first visit!",
                  time: "10:30 AM",
                },
                {
                  from: "lead",
                  text: "YES! What times are available tomorrow?",
                  time: "10:42 AM",
                },
                {
                  from: "you",
                  text: "Awesome! We have openings at 6am, 9am, 12pm, and 5pm. Which works best for you?",
                  time: "10:45 AM",
                },
                {
                  from: "lead",
                  text: "5pm would be perfect!",
                  time: "10:47 AM",
                },
                {
                  from: "you",
                  text: "You're all set for 5pm tomorrow! Ask for Mike at the front desk. See you there! \u{1F4AA}",
                  time: "10:48 AM",
                },
              ].map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === "you" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2.5 ${
                      msg.from === "you"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`mt-1 text-xs ${
                        msg.from === "you"
                          ? "text-teal-200"
                          : "text-slate-400"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2 rounded-lg border border-slate-300 p-2">
              <div className="flex-1 px-2 text-sm text-slate-400">
                Type your reply...
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-white">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            Everything you need for SMS conversations
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Instant reply notifications
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                When a lead texts back, you see it immediately in your
                dashboard. Inbound messages arrive via Twilio webhook in
                real time — no polling, no delays.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Reply from the dashboard
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Type your response right in the lead detail view. Your reply
                is sent from your Captivly.ai phone number, so the conversation
                stays in one thread on the lead&apos;s phone.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Automatic sequence pausing
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                When a lead replies, their automated sequence pauses
                immediately. This prevents awkward overlaps between your
                personal reply and the next scheduled automated message.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Full conversation history
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Every message — automated and manual — is logged in the
                lead&apos;s timeline. See the complete SMS thread alongside
                email outreach for full context.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Dedicated phone number
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                All SMS messages come from a consistent phone number via
                Twilio. Leads can save it and text you anytime — it&apos;s
                a direct line to your business through Captivly.ai.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            One-way vs two-way SMS
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                One-way (basic)
              </h3>
              <ul className="mt-4 space-y-2">
                {[
                  "Send automated messages",
                  "Detect replies (pause sequence)",
                  "Reply notification only",
                  "Must switch to phone to respond",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <span className="text-slate-400">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Two-way (Captivly.ai)
              </h3>
              <ul className="mt-4 space-y-2">
                {[
                  "Send automated messages",
                  "Detect replies (pause sequence)",
                  "See replies in dashboard instantly",
                  "Respond directly from dashboard",
                  "Full threaded conversation view",
                  "Complete message history",
                ].map((item) => (
                  <li
                    key={item}
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
    </FeatureLayout>
  );
}
