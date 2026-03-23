import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "Instagram DM Automation",
  description:
    "When someone clicks your Instagram ad and sends a DM, Captivly.ai responds instantly with AI-generated replies.",
  openGraph: {
    title: "Instagram DM Automation - Captivly.ai",
    description:
      "AI responds instantly to Instagram DMs from your ads. Turn every DM into a customer.",
    url: "https://captivly.ai/features/instagram-dm",
  },
};

export default function InstagramDmPage() {
  return (
    <FeatureLayout
      title="Instagram DM Automation"
      description="When someone clicks your Instagram ad and sends a DM, Captivly.ai responds instantly with AI-generated replies. Turn every DM into a conversation, every conversation into a customer."
      ctaHeading="Never miss another DM"
      ctaDescription="Let AI handle the first response while you focus on running your business. Every DM gets answered in seconds, 24/7."
    >
      {/* The problem */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            DMs are the new front door
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
            Instagram users increasingly prefer messaging over forms.
            But most businesses can&apos;t reply fast enough — and every
            minute of delay costs conversions.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-red-500">5 min</div>
              <p className="mt-2 text-sm text-slate-600">
                response time drops conversion rates by 80%. Most businesses
                take hours or days to reply to DMs.
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600">2B+</div>
              <p className="mt-2 text-sm text-slate-600">
                monthly active Instagram users. Your local customers are
                already on the platform daily.
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                &lt;10s
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Captivly.ai&apos;s AI response time. Leads get an instant,
                personalized reply while they&apos;re still engaged.
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
                title: "Ad click → DM",
                description:
                  "A customer sees your Instagram ad with a \"Send Message\" CTA and taps it.",
              },
              {
                step: "2",
                title: "AI responds",
                description:
                  "Captivly.ai receives the DM via the Instagram Messaging API and sends an AI-crafted reply within seconds.",
              },
              {
                step: "3",
                title: "Qualify & capture",
                description:
                  "The AI asks qualifying questions, captures their info, and saves them as a lead in your pipeline.",
              },
              {
                step: "4",
                title: "Sequence starts",
                description:
                  "The lead is scored and enters your email/SMS outreach sequence — all automated.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
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

      {/* Example conversation */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Example conversation
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm text-slate-600">
            Here&apos;s what an automated Instagram DM conversation looks
            like for a gym running a free trial campaign.
          </p>
          <div className="mt-12 space-y-4">
            {/* Lead message */}
            <div className="flex justify-end">
              <div className="max-w-xs rounded-2xl rounded-br-sm bg-indigo-500 px-4 py-2.5 text-sm text-white">
                Hey! I saw your ad about a free 7-day trial. Is that still
                available?
              </div>
            </div>
            {/* AI reply */}
            <div className="flex justify-start">
              <div className="max-w-xs rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-900">
                Hey! Yes, the free 7-day trial is absolutely still
                available! We&apos;d love to have you. What&apos;s your
                name so I can get you set up?
              </div>
            </div>
            {/* Lead */}
            <div className="flex justify-end">
              <div className="max-w-xs rounded-2xl rounded-br-sm bg-indigo-500 px-4 py-2.5 text-sm text-white">
                I&apos;m Sarah! What time can I come in?
              </div>
            </div>
            {/* AI */}
            <div className="flex justify-start">
              <div className="max-w-xs rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-900">
                Awesome, Sarah! We&apos;re open 5am–10pm daily. I&apos;ll
                text you a booking link so you can pick the perfect time.
                What&apos;s the best number to reach you?
              </div>
            </div>
            {/* Lead */}
            <div className="flex justify-end">
              <div className="max-w-xs rounded-2xl rounded-br-sm bg-indigo-500 px-4 py-2.5 text-sm text-white">
                512-555-0123
              </div>
            </div>
            {/* AI */}
            <div className="flex justify-start">
              <div className="max-w-xs rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-900">
                Perfect! I just sent a booking link to your phone. See you
                soon, Sarah! 💪
              </div>
            </div>
            <p className="pt-4 text-center text-xs text-slate-400">
              Lead captured → AI score: 9/10 → SMS sequence started
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            DM automation features
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Context-aware AI replies
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                The AI knows your business type, current offer, hours, and
                location. Replies are natural and accurate — not generic
                chatbot responses.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Lead qualification in-chat
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                The AI naturally asks for name, phone, email, and any
                qualifying questions during the conversation. By the time
                the DM ends, you have a complete lead profile.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Human handoff
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                If the AI detects a complex question it can&apos;t answer
                confidently, it flags the conversation for human review.
                You get notified and can jump in from your dashboard.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                DM conversation history
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Every DM conversation is saved alongside the lead&apos;s
                email and SMS timeline. See the full picture of every
                interaction in one place.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
