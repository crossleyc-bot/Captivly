import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Captivly.ai — Stop Losing Leads. Start Closing Them.",
  description:
    "Captivly connects to your Facebook and Google ads, scores every lead with AI, and follows up automatically with personalized emails and texts — so you never miss another customer. Plans start at $49/mo.",
  openGraph: {
    title: "Captivly.ai — Stop Losing Leads. Start Closing Them.",
    description:
      "Captivly connects to your Facebook and Google ads, scores every lead with AI, and follows up automatically with personalized emails and texts — so you never miss another customer.",
    type: "website",
    url: "https://captivly.ai",
    siteName: "Captivly.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Captivly.ai — Stop Losing Leads. Start Closing Them.",
    description:
      "Captivly connects to your Facebook and Google ads, scores every lead with AI, and follows up automatically with personalized emails and texts — so you never miss another customer.",
  },
};

const faqs = [
  {
    q: "Do I need marketing experience?",
    a: "Not at all. Captivly handles everything — from lead capture to AI-powered follow-up. You set up once during onboarding and the platform runs your outreach automatically.",
  },
  {
    q: "How does the 14-day free trial work?",
    a: "You get full access to your chosen plan for 14 days. No charge until the trial ends. Cancel anytime during the trial and you won't be billed.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no contracts or cancellation fees. You can cancel, upgrade, or downgrade your plan at any time from the billing settings.",
  },
  {
    q: "What ad platforms do you support?",
    a: "Captivly integrates with Meta Lead Ads (Facebook & Instagram) and Google Ads lead forms. Leads flow in automatically via real-time webhooks.",
  },
  {
    q: "How fast are leads contacted?",
    a: "Within 60 seconds. As soon as a lead submits your ad form, Captivly scores them with AI and fires the first personalized email or SMS automatically.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use Supabase with row-level security so your data is fully isolated. All connections are encrypted, and we never share your lead data with other businesses.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader user={user ? { id: user.id } : null} />

      <main id="main-content" className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-teal-50 via-white to-white px-6 py-16 text-center">
        <div className="rounded-full bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-700">
          No agency fees. No marketing degree required.
        </div>
        <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight text-slate-900">
          Stop losing leads. Start closing them.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          Captivly connects to your Facebook and Google ads, scores every lead with AI,
          and follows up automatically with personalized emails and texts — so you never
          miss another customer.
        </p>
        <p className="mt-3 max-w-xl text-sm text-slate-500">
          Everything GoHighLevel does for $97/mo, plus AI that actually works — starting at $49/mo, without needing an agency to set it up.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-amber-200 hover:bg-teal-700"
          >
            Start Free Trial — No Card Required
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            See How It Works
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Plans start at $49/mo. 14-day free trial on every plan.
        </p>
      </main>

      <section id="how-it-works" className="border-t bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-600">
            Set up once. Captivly handles the rest — automatically.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-700">
                1
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">Connect Your Ads</h3>
              <p className="mt-2 text-sm text-slate-600">
                Link your Meta or Google ad account in one click. Leads flow into Captivly in real time.
              </p>
              <div className="absolute right-0 top-6 hidden h-px w-[calc(50%-1.5rem)] bg-slate-200 sm:block" />
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="absolute left-0 top-6 hidden h-px w-[calc(50%-1.5rem)] bg-slate-200 sm:block" />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-700">
                2
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">AI Takes Over</h3>
              <p className="mt-2 text-sm text-slate-600">
                Every lead is scored 1-10 by AI and matched to a personalized multi-step outreach sequence.
              </p>
              <div className="absolute right-0 top-6 hidden h-px w-[calc(50%-1.5rem)] bg-slate-200 sm:block" />
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="absolute left-0 top-6 hidden h-px w-[calc(50%-1.5rem)] bg-slate-200 sm:block" />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-700">
                3
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">Leads Convert on Autopilot</h3>
              <p className="mt-2 text-sm text-slate-600">
                Personalized emails and texts fire automatically. You focus on running your business.
              </p>
            </div>
          </div>

        </div>
      </section>

      <section id="features" className="border-t bg-white px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Everything you need to close leads on autopilot
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            No more spreadsheets. No more forgotten follow-ups. Captivly handles every lead from ad click to conversion.
          </p>

          <div className="mt-14">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Meta Lead Ads Integration",
                href: "/features/meta-lead-ads",
                description: "Connect your Facebook & Instagram ad accounts in one click. New leads flow in automatically via real-time webhooks.",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.34 8.06" />
                  </svg>
                ),
              },
              {
                title: "AI Lead Scoring",
                href: "/features/ai-lead-scoring",
                description: "Every lead is instantly scored 1-10 by AI based on fit with your ideal customer profile. Focus on the hottest leads first.",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                  </svg>
                ),
              },
              {
                title: "Automated Outreach Sequences",
                href: "/features/automated-outreach",
                description: "AI writes personalized multi-step email and SMS sequences. Leads get the right message at the right time.",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                ),
              },
              {
                title: "Real-Time Dashboard",
                href: "/features/dashboard",
                description: "See every lead, message status, and conversion in one place. Know exactly how your campaigns are performing.",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                ),
              },
              {
                title: "Google Ads Lead Forms",
                href: "/features/google-ads",
                description: "Capture high-intent leads from Google Search and YouTube ads. Scored and sequenced automatically in real time.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                ),
              },
              {
                title: "Two-Way SMS",
                href: "/features/two-way-sms",
                description: "When leads reply to your texts, see it instantly and respond right from your dashboard. Real conversations, one place.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <Link key={feature.title} href={feature.href} className="rounded-lg border border-slate-200 p-4 transition-colors hover:border-teal-300 hover:bg-teal-50/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </Link>
            ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/features/pricing"
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                See all features &rarr;
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="border-t bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Start small and scale as you grow. No contracts, cancel anytime.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {/* Starter */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">Starter</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">$49</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-left text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  100 leads/month
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  AI lead scoring
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  3-step email sequences
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 block rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Get Started
              </Link>
            </div>

            {/* Growth */}
            <div className="relative rounded-lg border-2 border-teal-600 bg-white p-6">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-0.5 text-xs font-medium text-white">
                Most Popular
              </span>
              <h3 className="text-sm font-semibold text-slate-900">Growth</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">$99</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-left text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  500 leads/month
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  500 SMS/month
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  5 campaigns, 5-step sequences
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 block rounded-md bg-teal-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal-700"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">Pro</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">$199</span>
                <span className="text-sm text-slate-500">/mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-left text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  2,000 leads + 2,000 SMS/month
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Unlimited campaigns
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  White-label + AI reports
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 block rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Get Started
              </Link>
            </div>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            All plans include a 14-day free trial. <Link href="/features/pricing" className="font-medium text-teal-600 hover:text-teal-700">Compare plans in detail &rarr;</Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-600">
            Everything you need to know before getting started.
          </p>

          <dl className="mt-10 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-lg border border-slate-200 px-5 py-4">
                <dt className="text-sm font-semibold text-slate-900">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Built for local businesses that run on leads
          </p>
          <p className="mt-4 text-xl font-semibold text-slate-900">
            Gyms, salons, restaurants, and home service providers choose Captivly
          </p>
          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <p className="text-3xl font-bold text-teal-600">60s</p>
              <p className="mt-1 text-sm text-slate-500">Average lead response time</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-teal-600">10x</p>
              <p className="mt-1 text-sm text-slate-500">Faster than manual follow-up</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-teal-600">98%</p>
              <p className="mt-1 text-sm text-slate-500">SMS open rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-teal-600">24/7</p>
              <p className="mt-1 text-sm text-slate-500">AI-powered outreach</p>
            </div>
          </div>

          <div className="mt-12 space-y-3">
            <Link
              href="/signup"
              className="inline-block rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-amber-200 hover:bg-teal-700"
            >
              Start Your Free Trial — No Card Required
            </Link>
            <p className="text-xs text-slate-400">
              Set up in under 20 minutes. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
