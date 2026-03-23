import Link from "next/link";
import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start small with 100 leads per month, scale to 2,000+. SMS, multiple campaigns, and AI reports unlock as you grow. No long-term contracts.",
  openGraph: {
    title: "Pricing - Captivly.ai",
    description:
      "Simple pricing from $49/mo. SMS, multiple campaigns, and AI reports unlock as you grow.",
    url: "https://captivly.ai/features/pricing",
  },
};

const plans = [
  {
    name: "Starter",
    price: "$49",
    description: "For businesses just getting started with lead generation.",
    features: [
      "100 leads per month",
      "Meta Lead Ads integration",
      "AI lead scoring",
      "3-step email sequences",
      "1 campaign",
    ],
    limitations: ["No SMS outreach", "No multiple campaigns"],
    cta: "Start with Starter",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$99",
    description: "For growing businesses ready to scale their outreach.",
    features: [
      "500 leads per month",
      "500 SMS messages per month",
      "5-step email + SMS sequences",
      "Up to 5 campaigns",
      "AI lead scoring",
      "Reply detection",
    ],
    limitations: [],
    cta: "Start with Growth",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$199",
    description: "For serious businesses and agencies that want it all.",
    features: [
      "2,000 leads per month",
      "2,000 SMS messages per month",
      "5-step email + SMS sequences",
      "Unlimited campaigns",
      "AI monthly report card",
      "AI chat widget",
      "White-label branding",
    ],
    limitations: [],
    cta: "Start with Pro",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <FeatureLayout
      title="Smart Plan Tiers"
      description="Start small with 100 leads per month, scale to 2,000+. SMS, multiple campaigns, and AI reports unlock as you grow. No long-term contracts."
      ctaHeading="Start generating leads today"
      ctaDescription="Pick the plan that fits your business. Upgrade anytime as you grow."
    >
      {/* Pricing cards */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-6 ${
                plan.highlighted
                  ? "border-teal-300 ring-2 ring-teal-100"
                  : "border-slate-200"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-slate-900">
                {plan.name}
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">
                  {plan.price}
                </span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {plan.description}
              </p>
              <Link
                href="/signup"
                className={`mt-6 block rounded-full px-4 py-2.5 text-center text-sm font-medium ${
                  plan.highlighted
                    ? "bg-teal-600 text-white hover:bg-teal-700"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {plan.cta}
              </Link>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-slate-700"
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
                    {feature}
                  </li>
                ))}
                {plan.limitations.map((limitation) => (
                  <li
                    key={limitation}
                    className="flex items-start gap-2 text-sm text-slate-400"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    {limitation}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Feature comparison */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Full feature comparison
          </h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-slate-500">
                  <th className="pb-2 pr-4">Feature</th>
                  <th className="pb-2 pr-4">Starter $49</th>
                  <th className="pb-2 pr-4">Growth $99</th>
                  <th className="pb-2">Pro $199</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Leads per month", "100", "500", "2,000"],
                  ["SMS per month", "—", "500", "2,000"],
                  ["Campaigns", "1", "5", "Unlimited"],
                  ["Sequence steps", "3", "5", "5"],
                  ["Meta Lead Ads", "Yes", "Yes", "Yes"],
                  ["AI lead scoring", "Yes", "Yes", "Yes"],
                  ["Email outreach", "Yes", "Yes", "Yes"],
                  ["SMS outreach", "—", "Yes", "Yes"],
                  ["AI monthly report", "—", "—", "Yes"],
                  ["AI chat widget", "—", "—", "Yes"],
                  ["White-labeling", "—", "—", "Yes"],
                ].map(([feature, starter, growth, pro]) => (
                  <tr key={feature} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {feature}
                    </td>
                    <td
                      className={`py-3 pr-4 ${starter === "—" ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {starter}
                    </td>
                    <td
                      className={`py-3 pr-4 ${growth === "—" ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {growth}
                    </td>
                    <td
                      className={`py-3 ${pro === "—" ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Common questions
          </h2>
          <div className="mt-8 space-y-6">
            {[
              {
                q: "Can I change plans later?",
                a: "Yes. You can upgrade or downgrade at any time from your billing settings. Changes take effect immediately, with prorated billing.",
              },
              {
                q: "What happens when I hit my lead limit?",
                a: "New leads will be paused and you'll see an upgrade prompt. No leads are lost — they'll be processed once you upgrade or when the next billing cycle starts.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes. Every plan starts with a free trial so you can connect your ads and see leads flow in before being charged.",
              },
              {
                q: "Do unused SMS messages roll over?",
                a: "No. SMS allowances reset each billing cycle. This keeps pricing simple and predictable.",
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  {faq.q}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
