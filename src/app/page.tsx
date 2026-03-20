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
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-white px-6 text-center">
        <span className="mb-4 inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-semibold text-indigo-700">
          AI-Powered Lead Generation
        </span>
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-zinc-900">
          Automated lead generation for local businesses
        </h1>
        <p className="mt-6 max-w-lg text-lg text-zinc-600">
          Connect your Meta Lead Ads, score leads with AI, and fire
          personalized email &amp; SMS outreach — all on autopilot.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
          >
            Start Free Trial
          </Link>
          <Link
            href="#features"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Learn More
          </Link>
        </div>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} Captivly. All rights reserved.
      </footer>
    </div>
  );
}
