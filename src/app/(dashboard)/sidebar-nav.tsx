"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "./logout-button";
import { useBranding } from "./branding-provider";
import { LogoIcon } from "@/components/logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/leads", label: "Leads" },
  { href: "/sequences", label: "Sequences" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reports", label: "Reports" },
  { href: "/referrals", label: "Referrals" },
  { href: "/chat-widget", label: "Chat Widget" },
  { href: "/white-label", label: "White Label" },
  { href: "/agency", label: "Agency" },
  { href: "/settings", label: "Settings" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const branding = useBranding();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold">
          {branding.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt="" className="h-6 w-6 rounded object-cover" />
          ) : (
            <LogoIcon size={22} />
          )}
          {branding.app_name}
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 px-4 py-6 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-white">
          {branding.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt="" className="h-7 w-7 rounded object-cover" />
          ) : (
            <LogoIcon size={26} className="text-indigo-400" />
          )}
          {branding.app_name}
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {!branding.hide_captivly_branding && (
          <p className="mb-2 text-xs text-slate-500">Powered by Captivly</p>
        )}
        <LogoutButton />
      </aside>
    </>
  );
}
