"use client";

import { useState } from "react";
import { fetchWithCsrf } from "@/lib/fetch-with-csrf";

export function CreateReferralLink() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetchWithCsrf("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrer_name: name || undefined,
          referrer_email: email || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create link");
      }

      const data = await res.json();
      setResult({ code: data.link.code });
      setName("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Create Referral Link</h2>
      <form onSubmit={handleCreate} className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="ref-name" className="block text-xs text-slate-500">
            Referrer Name
          </label>
          <input
            id="ref-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            className="mt-1 rounded-md border px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="ref-email" className="block text-xs text-slate-500">
            Referrer Email
          </label>
          <input
            id="ref-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="mt-1 rounded-md border px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Link"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {result && (
        <div className="mt-3 rounded-md bg-green-50 p-3">
          <p className="text-sm font-medium text-green-800">Link created!</p>
          <p className="mt-1 text-sm font-mono text-green-700 break-all">
            {appUrl}/refer/{result.code}
          </p>
        </div>
      )}
    </div>
  );
}
