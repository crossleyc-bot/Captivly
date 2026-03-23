import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      {
        q: "How do I set up my account?",
        a: "After signing up, the onboarding wizard walks you through five steps: enter your business details, define your target audience, set your primary offer, connect your Meta ad account, and choose a subscription plan. Once complete, Captivly.ai automatically generates a starter campaign for you to review and activate.",
      },
      {
        q: "How do I connect my Meta ad account?",
        a: "During onboarding (or later in Settings), click \"Connect Meta Account.\" You'll be redirected to Facebook to authorize Captivly.ai. Once approved, your ad account and pages are linked automatically. Captivly.ai can then create campaigns and receive leads in real time.",
      },
      {
        q: "How do I connect Google Ads?",
        a: "Go to Settings and click \"Connect Google Ads.\" Authorize access via Google OAuth. Once connected, leads from Google Lead Form extensions flow into Captivly.ai in real time, scored and sequenced just like Meta leads.",
      },
    ],
  },
  {
    id: "leads",
    title: "Leads & Scoring",
    items: [
      {
        q: "Where do my leads come from?",
        a: "Leads arrive automatically when someone submits a form on your Meta Lead Ad or Google Ads lead form extension. They appear on the Leads page within seconds of submission.",
      },
      {
        q: "What is AI lead scoring?",
        a: "Every incoming lead is scored 1\u201310 by AI based on how well they match your ideal customer profile (location, age, interests, and form answers). Higher scores mean a stronger fit. Use scores to prioritize follow-ups and focus on your hottest prospects.",
      },
      {
        q: "Can I manually update a lead\u2019s status?",
        a: "Yes. Open any lead from the Leads page and update its status \u2014 for example, marking it as \"converted\" when they become a paying customer. Status changes are reflected across your dashboard and analytics.",
      },
    ],
  },
  {
    id: "campaigns",
    title: "Campaigns",
    items: [
      {
        q: "How do I create a campaign?",
        a: "Go to the Campaigns page and click \"New Campaign.\" Captivly.ai uses AI to generate ad copy and a multi-step outreach sequence based on your business type, offer, and tone preferences. Review the draft, adjust if needed, and activate when ready.",
      },
      {
        q: "What campaign statuses are there?",
        a: "Campaigns can be Draft (not yet running), Active (live and receiving leads), Paused (temporarily stopped), or Completed (finished). You can change status from the campaign detail page.",
      },
      {
        q: "How many campaigns can I run?",
        a: "Starter plans include 1 campaign. Growth plans allow up to 5, and Pro plans have unlimited campaigns. Upgrade anytime from Settings to unlock more.",
      },
    ],
  },
  {
    id: "sequences",
    title: "Outreach Sequences",
    items: [
      {
        q: "What is an outreach sequence?",
        a: "A sequence is a series of automated messages (email and/or SMS) sent to a lead over time. For example, a 5-step sequence might send a welcome email on day 1, a follow-up SMS on day 3, another email on day 5, and so on. AI personalizes each message based on your business and the lead\u2019s information.",
      },
      {
        q: "How many steps can my sequence have?",
        a: "Starter plans support 3-step sequences (email only). Growth and Pro plans support 5-step sequences with both email and SMS channels.",
      },
      {
        q: "What happens when a lead replies?",
        a: "When a lead replies to an email or SMS, the sequence is automatically paused for that lead so they don\u2019t receive further automated messages. You can view the reply and respond directly from the lead detail page.",
      },
    ],
  },
  {
    id: "messaging",
    title: "Email & SMS",
    items: [
      {
        q: "How does email sending work?",
        a: "Emails are sent via Resend. Each sequence step fires automatically based on the configured delay (e.g., 1 day, 3 days after lead capture). You can track delivery status \u2014 queued, sent, delivered, or failed \u2014 from the lead\u2019s message timeline.",
      },
      {
        q: "How does SMS work?",
        a: "SMS is available on Growth and Pro plans. Messages are sent via Twilio from your dedicated number. SMS usage is tracked against your monthly limit (500 for Growth, 2,000 for Pro).",
      },
      {
        q: "What are my monthly SMS limits?",
        a: "Starter: 0 (email only). Growth: 500 SMS/month. Pro: 2,000 SMS/month. You can track your current usage in Settings. When you approach your limit, you\u2019ll see an upgrade prompt.",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    items: [
      {
        q: "What analytics are available?",
        a: "The Analytics page shows lead volume, conversion rates, message delivery stats, and campaign performance over time. Use it to understand which campaigns and channels drive the best results.",
      },
      {
        q: "What is the AI Report Card?",
        a: "Available on the Pro plan, the AI Report Card is a monthly plain-English summary generated on the 1st of each month. It covers your key metrics, highlights top insights, and provides one actionable recommendation.",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing & Plans",
    items: [
      {
        q: "How do I upgrade my plan?",
        a: "Go to Settings and click \"Manage Billing\" to open the Stripe customer portal. From there you can upgrade, downgrade, or update your payment method.",
      },
      {
        q: "What happens if I hit my lead limit?",
        a: "When you reach your monthly lead limit (100 for Starter, 500 for Growth, 2,000 for Pro), new leads will be blocked until the next billing cycle. You\u2019ll see a banner prompting you to upgrade for a higher limit.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes. Open the billing portal from Settings and cancel anytime. Your account remains active until the end of the current billing period.",
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    items: [
      {
        q: "Does Captivly.ai integrate with Zapier?",
        a: "Yes. You can connect Captivly.ai to thousands of apps via Zapier. Use the Leads trigger to push new leads to your CRM, or the Conversions trigger to sync conversion data. Manage your API keys in Settings.",
      },
      {
        q: "Can I embed a chat widget on my website?",
        a: "Pro plan users can embed an AI-powered chat widget on their website. It answers visitor questions and captures contact info 24/7. Find the embed code on the Chat Widget page in your dashboard.",
      },
      {
        q: "What is white-labeling?",
        a: "On the Pro plan, you can rebrand Captivly.ai with your own logo, colors, app name, and custom domain. Your clients will see your brand throughout the dashboard. Configure this on the White Label page.",
      },
    ],
  },
];

export default async function HelpGuidePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Help Guide</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything you need to know about using Captivly.ai.
        </p>
      </div>

      {/* Table of contents */}
      <nav className="rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-slate-900">On this page</h2>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sections */}
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
          <div className="space-y-3">
            {section.items.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border px-4 py-3"
              >
                <summary className="cursor-pointer text-sm font-medium text-slate-900 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between">
                    {item.q}
                    <svg
                      className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-2 text-sm text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="rounded-lg border border-dashed border-slate-300 px-6 py-8 text-center">
        <p className="text-sm text-slate-500">
          Still have questions? Reach out to our support team at{" "}
          <a href="mailto:support@captivly.ai" className="text-blue-600 hover:text-blue-700 hover:underline">
            support@captivly.ai
          </a>
        </p>
      </div>
    </div>
  );
}
