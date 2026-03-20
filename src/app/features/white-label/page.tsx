import Link from "next/link";
import { Logo } from "@/components/logo";

export default function WhiteLabelPage() {
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
            <span className="mb-4 inline-block rounded-full bg-amber-100 px-4 py-1.5 text-xs font-semibold text-amber-700">
              Pro Plan
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              White-Label Ready
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              On the Pro plan, rebrand Captivly as your own platform. Custom
              logo, colors, and domain — your clients will never know
              it&apos;s Captivly under the hood.
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

        {/* What you can customize */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              What you can customize
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
              Every client-facing element can be branded to match your
              business or agency identity.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "App Name",
                  description:
                    "Replace \"Captivly\" with your own brand name throughout the entire dashboard.",
                },
                {
                  title: "Logo",
                  description:
                    "Upload your own logo. It appears in the sidebar, login page, and anywhere Captivly's logo normally shows.",
                },
                {
                  title: "Primary Color",
                  description:
                    "Set your brand's primary color. It's used for active nav links, buttons, and accent elements.",
                },
                {
                  title: "Accent Color",
                  description:
                    "Customize the accent color used for highlights, badges, and interactive elements.",
                },
                {
                  title: "Favicon",
                  description:
                    "Upload a custom favicon so the browser tab shows your brand, not Captivly's.",
                },
                {
                  title: "Hide Captivly Branding",
                  description:
                    "Remove the \"Powered by Captivly\" text from the sidebar footer for a fully clean white-label experience.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-slate-200 p-6"
                >
                  <h3 className="text-sm font-semibold text-slate-900">
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
              Who it&apos;s for
            </h2>
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Marketing agencies
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Manage lead generation for multiple clients under your own
                  brand. Each client sees your agency name and logo when they
                  log into their dashboard.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Franchise operators
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Roll out a branded lead generation platform across all your
                  franchise locations. Consistent branding, centralized
                  management.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  SaaS resellers
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Offer AI-powered lead generation as part of your product
                  suite. White-label Captivly and bundle it with your existing
                  services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Setup takes minutes
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-600">
                  1
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  Upgrade to Pro
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  White-labeling is available exclusively on the Pro plan at
                  $199/month.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-600">
                  2
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  Configure your brand
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Go to Settings &rarr; White Label. Upload your logo, set
                  colors, and enter your brand name.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-600">
                  3
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  Go live
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Your branding is applied instantly. Share the login link with
                  your clients and they&apos;ll see your brand, not ours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-slate-50 px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Make it yours
            </h2>
            <p className="mt-4 text-slate-600">
              Upgrade to Pro and launch your own branded lead generation
              platform in minutes.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-amber-200 hover:bg-teal-700"
            >
              Get Started with Pro
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Captivly. All rights reserved.
      </footer>
    </div>
  );
}
