"use client";

import { useState } from "react";
import type { ReferralLink } from "@/types/database";
import { fetchWithCsrf } from "@/lib/fetch-with-csrf";

export function ReferralLinkRow({ link }: { link: ReferralLink }) {
  const [copied, setCopied] = useState(false);
  const [isActive, setIsActive] = useState(link.is_active);
  const [toggling, setToggling] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
  const fullUrl = `${appUrl}/refer/${link.code}`;

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleToggle() {
    setToggling(true);
    try {
      const res = await fetchWithCsrf(`/api/referrals/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (res.ok) {
        setIsActive(!isActive);
      }
    } catch {
      // Silently fail
    } finally {
      setToggling(false);
    }
  }

  const rate =
    link.clicks > 0
      ? `${Math.round((link.conversions / link.clicks) * 100)}%`
      : "\u2014";

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-4">
        <p className="font-medium">{link.referrer_name ?? "\u2014"}</p>
        {link.referrer_email && (
          <p className="text-xs text-slate-400">{link.referrer_email}</p>
        )}
      </td>
      <td className="py-2 pr-4">
        <p className="max-w-[200px] truncate font-mono text-xs text-slate-500" title={fullUrl}>
          {fullUrl}
        </p>
      </td>
      <td className="py-2 pr-4">{link.clicks}</td>
      <td className="py-2 pr-4">{link.conversions}</td>
      <td className="py-2 pr-4">{rate}</td>
      <td className="py-2 pr-4">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isActive
              ? "bg-green-50 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            className={`rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50 ${
              isActive
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-green-200 text-green-600 hover:bg-green-50"
            }`}
          >
            {toggling ? "..." : isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </td>
    </tr>
  );
}
