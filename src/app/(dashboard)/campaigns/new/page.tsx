"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type AdPlatform = "meta" | "google" | "tiktok" | "linkedin";

const PLATFORMS: { id: AdPlatform; label: string; color: string; endpoint: string }[] = [
  { id: "meta", label: "Meta (Facebook/Instagram)", color: "#1877F2", endpoint: "/api/meta/create-campaign" },
  { id: "google", label: "Google Ads", color: "#4285F4", endpoint: "/api/google/create-campaign" },
  { id: "tiktok", label: "TikTok", color: "#000000", endpoint: "/api/tiktok/create-campaign" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", endpoint: "/api/linkedin/create-campaign" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState<AdPlatform>("meta");
  const [name, setName] = useState("");
  const [dailyBudget, setDailyBudget] = useState("10.00");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform)!;

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

    const res = await fetch(selectedPlatform.endpoint, {
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
    "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href="/campaigns"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          &larr; Back to campaigns
        </Link>
        <h1 className="mt-2 text-2xl font-bold">New Campaign</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a lead generation campaign on your chosen ad platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Platform selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Ad platform
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  platform === p.id
                    ? "border-slate-900 ring-1 ring-slate-900"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Your {selectedPlatform.label} account must be connected first.
          </p>
        </div>

        <div>
          <label
            htmlFor="campaign-name"
            className="block text-sm font-medium text-slate-700"
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
            className="block text-sm font-medium text-slate-700"
          >
            Daily budget (USD)
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
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
              className="block w-full rounded-md border border-slate-300 py-2 pl-7 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : `Create on ${selectedPlatform.label}`}
          </button>
          <Link
            href="/campaigns"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
