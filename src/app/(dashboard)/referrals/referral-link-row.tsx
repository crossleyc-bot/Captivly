"use client";

import { useState } from "react";
import type { ReferralLink } from "@/types/database";

export function ReferralLinkRow({ link }: { link: ReferralLink }) {
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = `${appUrl}?ref=${link.code}`;

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const rate =
    link.clicks > 0
      ? `${Math.round((link.conversions / link.clicks) * 100)}%`
      : "—";

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-4">
        <p className="font-medium">{link.referrer_name ?? "—"}</p>
        {link.referrer_email && (
          <p className="text-xs text-slate-400">{link.referrer_email}</p>
        )}
      </td>
      <td className="py-2 pr-4 font-mono text-xs">{link.code}</td>
      <td className="py-2 pr-4">{link.clicks}</td>
      <td className="py-2 pr-4">{link.conversions}</td>
      <td className="py-2 pr-4">{rate}</td>
      <td className="py-2 pr-4">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            link.is_active
              ? "bg-green-50 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {link.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="py-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </td>
    </tr>
  );
}
