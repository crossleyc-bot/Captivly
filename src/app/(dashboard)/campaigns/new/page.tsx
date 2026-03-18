"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dailyBudget, setDailyBudget] = useState("10.00");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const budgetCents = Math.round(parseFloat(dailyBudget) * 100);
    if (isNaN(budgetCents) || budgetCents < 100) {
      setError("Daily budget must be at least $1.00.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/meta/create-campaign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        daily_budget_cents: budgetCents,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create campaign.");
      setLoading(false);
      return;
    }

    router.push(`/campaigns/${data.campaign.id}`);
    router.refresh();
  }

  const inputClass =
    "mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href="/campaigns"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          &larr; Back to campaigns
        </Link>
        <h1 className="mt-2 text-2xl font-bold">New Campaign</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create a new Meta Lead Ad campaign. Your Meta ad account must be
          connected first.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="campaign-name"
            className="block text-sm font-medium text-zinc-700"
          >
            Campaign name
          </label>
          <input
            id="campaign-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Membership Promo"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="daily-budget"
            className="block text-sm font-medium text-zinc-700"
          >
            Daily budget (USD)
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
              $
            </span>
            <input
              id="daily-budget"
              type="number"
              required
              min="1"
              step="0.01"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              className="block w-full rounded-md border border-zinc-300 py-2 pl-7 pr-3 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create campaign"}
          </button>
          <Link
            href="/campaigns"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
