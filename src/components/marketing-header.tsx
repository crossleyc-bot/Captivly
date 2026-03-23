"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

const navLinks = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

interface MarketingHeaderProps {
  user?: { id: string } | null;
  showNav?: boolean;
}

export function MarketingHeader({ user, showNav = true }: MarketingHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative flex items-center justify-between border-b px-6 py-4">
      <Link href="/">
        <Logo size={24} />
      </Link>

      {showNav && (
        <>
          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </>
      )}

      <nav className={`flex items-center gap-4 ${showNav ? "hidden sm:flex" : ""}`}>
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
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
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

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-b bg-white px-6 py-4 shadow-lg sm:hidden">
          <nav className="flex flex-col gap-3">
            {showNav &&
              navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              ))}
            <div className="mt-2 border-t pt-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="block rounded-md bg-teal-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal-700"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="block rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="block rounded-md bg-teal-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal-700"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
