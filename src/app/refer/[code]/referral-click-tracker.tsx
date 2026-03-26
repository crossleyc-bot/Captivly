"use client";

import { useEffect } from "react";

export function ReferralClickTracker({ code }: { code: string }) {
  useEffect(() => {
    fetch("/api/referrals/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {});
  }, [code]);

  return null;
}
