import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link href="/">
          <Logo size={24} />
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Dashboard
            </Link>
          ) : (
            <>
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
            </>
          )}
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-teal-50 via-white to-white px-6 py-12 text-center">
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-slate-900">
          Automated lead generation for local businesses
        </h1>
        <p className="mt-6 max-w-lg text-lg text-slate-600">
          Connect your Meta Lead Ads, score leads with AI, and fire
          personalized email &amp; SMS outreach — all on autopilot.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-amber-200 hover:bg-teal-700"
          >
            Start Free Trial
          </Link>
          <Link
            href="#features"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Learn More
          </Link>
        </div>
      </main>

      <section className="border-t bg-white px-6 py-16">
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

          <div className="mt-10 text-center">
            <Link
              href="/signup"
              className="rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-amber-200 hover:bg-teal-700"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="border-t bg-white px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Everything you need to convert leads on autopilot
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            Captivly.ai connects to your ad accounts, scores every lead with AI, and sends personalized outreach automatically.
          </p>

          <div className="mt-14">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Meta Lead Ads Integration",
                href: "/features/meta-lead-ads",
                description: "Connect your Facebook & Instagram ad accounts in one click. New leads flow in automatically via real-time webhooks.",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.34 8.06" />
                  </svg>
                ),
              },
              {
                title: "AI Lead Scoring",
                href: "/features/ai-lead-scoring",
                description: "Every lead is instantly scored 1-10 by AI based on fit with your ideal customer profile. Focus on the hottest leads first.",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                  </svg>
                ),
              },
              {
                title: "Automated Outreach Sequences",
                href: "/features/automated-outreach",
                description: "AI writes personalized multi-step email and SMS sequences. Leads get the right message at the right time.",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                ),
              },
              {
                title: "Real-Time Dashboard",
                href: "/features/dashboard",
                description: "See every lead, message status, and conversion in one place. Know exactly how your campaigns are performing.",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                ),
              },
              {
                title: "Google Ads Lead Forms",
                href: "/features/google-ads",
                description: "Capture high-intent leads from Google Search and YouTube ads. Scored and sequenced automatically in real time.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                ),
              },
              {
                title: "Two-Way SMS",
                href: "/features/two-way-sms",
                description: "When leads reply to your texts, see it instantly and respond right from your dashboard. Real conversations, one place.",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
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

      <footer className="border-t px-6 py-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Captivly.ai. All rights reserved.
      </footer>
    </div>
  );
}
