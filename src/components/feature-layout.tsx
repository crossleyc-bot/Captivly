import Link from "next/link";
import { Logo } from "@/components/logo";
import { MarketingFooter } from "@/components/marketing-footer";

interface FeatureLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  ctaHeading: string;
  ctaDescription: string;
  ctaLabel?: string;
}

export function FeatureLayout({
  children,
  title,
  description,
  ctaHeading,
  ctaDescription,
  ctaLabel = "Get Started Free",
}: FeatureLayoutProps) {
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
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-blue-50 via-white to-white px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-6 text-lg text-slate-600">{description}</p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-blue-600/25 hover:bg-blue-700"
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

        {children}

        {/* CTA */}
        <section className="border-t bg-white px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">{ctaHeading}</h2>
            <p className="mt-4 text-slate-600">{ctaDescription}</p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-blue-600/25 hover:bg-blue-700"
            >
              {ctaLabel}
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
