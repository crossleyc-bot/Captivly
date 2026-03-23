import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "AI-Powered Live Chat",
  description:
    "Capture leads from your website with an AI chat widget that answers questions, qualifies visitors, and collects contact info 24/7.",
  openGraph: {
    title: "AI-Powered Live Chat - Captivly.ai",
    description:
      "AI chat widget that answers questions, qualifies visitors, and captures leads 24/7.",
    url: "https://captivly.ai/features/live-chat",
  },
};

export default function LiveChatPage() {
  return (
    <FeatureLayout
      title="AI-Powered Live Chat"
      description="Capture leads directly from your website with an AI chat widget that answers questions, qualifies visitors, and collects contact info — 24/7, without you lifting a finger."
      ctaHeading="Turn website visitors into leads"
      ctaDescription="Add the AI chat widget to your site and start capturing leads you'd otherwise lose."
    >
      {/* How it works */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                1
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                Embed on your site
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Add a single line of JavaScript to your website. The chat
                widget appears in the bottom corner, matching your brand
                colors.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                2
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                AI engages visitors
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Claude AI answers questions about your business, services,
                pricing, and hours. It knows your offers and speaks in your
                brand&apos;s tone.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                3
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                Leads flow into Captivly.ai
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                When the visitor shares their name, email, or phone, a new
                lead is created automatically — scored by AI and enrolled in
                your outreach sequence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            More than a chatbot
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Trained on your business
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                The AI is pre-loaded with your business type, services,
                location, hours, and primary offer. It answers visitor
                questions accurately without scripted flows or decision
                trees.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Natural lead qualification
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Instead of a boring form, the AI qualifies visitors through
                natural conversation. It asks about their goals, timeline,
                and preferences — then captures their contact info when
                they&apos;re ready.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Available 24/7
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Most local business websites get traffic outside business
                hours. The AI chat widget captures leads at midnight, on
                weekends, and on holidays — when you&apos;d normally miss
                them.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Seamless handoff
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                If a visitor asks something the AI can&apos;t handle, it
                collects their info and flags the conversation for you to
                follow up. You see the full chat transcript in your
                dashboard.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Branded to match your site
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                The widget uses your brand colors and name. On the Pro plan
                with white-labeling, there&apos;s zero trace of Captivly.ai —
                it looks and feels like your own tool.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Perfect for local businesses
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                business: "Gyms & Studios",
                example:
                  "\"What classes do you offer?\" → AI answers, then offers a free trial and captures the lead.",
              },
              {
                business: "Salons & Spas",
                example:
                  "\"Do you take walk-ins?\" → AI shares availability, suggests booking, and collects their email.",
              },
              {
                business: "Restaurants",
                example:
                  "\"Can I book a table for 6?\" → AI shares hours, menu highlights, and captures a reservation request.",
              },
              {
                business: "Home Services",
                example:
                  "\"How much for a roof inspection?\" → AI qualifies the job, collects their address and phone.",
              },
              {
                business: "Dental Practices",
                example:
                  "\"Do you accept my insurance?\" → AI checks common plans, then books a consultation.",
              },
              {
                business: "Real Estate",
                example:
                  "\"What's available in my budget?\" → AI asks about preferences and captures buyer info.",
              },
            ].map((item) => (
              <div
                key={item.business}
                className="rounded-lg border border-slate-200 p-6"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {item.business}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{item.example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
