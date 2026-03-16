"use client";

import { useState } from "react";
import type { PlanTier } from "@/types/database";

const PLANS: { tier: PlanTier; name: string; price: string }[] = [
  { tier: "starter", name: "Starter", price: "$49/mo" },
  { tier: "growth", name: "Growth", price: "$99/mo" },
  { tier: "pro", name: "Pro", price: "$199/mo" },
];

export function BillingActions({
  hasBilling,
  currentPlan,
}: {
  hasBilling: boolean;
  currentPlan: PlanTier;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(plan: PlanTier) {
    setLoading(plan);
    setError(null);

    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create checkout session");
      setLoading(null);
      return;
    }

    window.location.href = data.url;
  }

  async function handlePortal() {
    setLoading("portal");
    setError(null);

    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to open billing portal");
      setLoading(null);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Billing</h2>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {hasBilling ? (
        <button
          onClick={handlePortal}
          disabled={loading === "portal"}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading === "portal" ? "Opening..." : "Manage billing"}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">
            Subscribe to a plan to unlock all features.
          </p>
          <div className="flex gap-3">
            {PLANS.map(({ tier, name, price }) => (
              <button
                key={tier}
                onClick={() => handleCheckout(tier)}
                disabled={loading !== null || tier === currentPlan}
                className={`rounded-md border px-4 py-2 text-sm font-medium ${
                  tier === currentPlan
                    ? "border-zinc-300 text-zinc-400"
                    : "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-700"
                } disabled:opacity-50`}
              >
                {loading === tier ? "..." : `${name} ${price}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
