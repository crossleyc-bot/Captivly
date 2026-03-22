"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomDomain } from "@/types/database";

export function CustomDomainSection({
  initialDomain,
}: {
  initialDomain: CustomDomain | null;
}) {
  const router = useRouter();
  const [domain, setDomain] = useState(initialDomain?.domain ?? "");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/custom-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save domain");
      }

      setMessage("Domain registered. Add the TXT record below, then verify.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/custom-domain/verify", { method: "POST" });
      const data = await res.json();

      if (data.verified) {
        setMessage("Domain verified successfully!");
        router.refresh();
      } else {
        setError(data.message ?? "Verification failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setVerifying(false);
    }
  }

  async function handleRemove() {
    try {
      await fetch("/api/custom-domain", { method: "DELETE" });
      setDomain("");
      setMessage("Domain removed.");
      router.refresh();
    } catch {
      setError("Failed to remove domain");
    }
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Custom Domain</h2>
      <p className="text-sm text-slate-500">
        Use your own domain for the dashboard. Your customers will see your
        brand instead of Captivly.ai.
      </p>

      <form onSubmit={handleSave} className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="cd-domain" className="block text-sm font-medium">
            Domain
          </label>
          <input
            id="cd-domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="app.yourbusiness.com"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !domain.trim()}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Register Domain"}
        </button>
      </form>

      {initialDomain && !initialDomain.verified && (
        <div className="space-y-3 rounded-md bg-slate-50 p-3">
          <p className="text-sm font-medium">DNS Verification Required</p>
          <p className="text-xs text-slate-500">
            Add a TXT record to your domain with the following value:
          </p>
          <code className="block break-all rounded bg-white px-3 py-2 text-xs border">
            {initialDomain.verification_token}
          </code>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {verifying ? "Checking..." : "Verify Domain"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-md border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {initialDomain?.verified && (
        <div className="flex items-center justify-between rounded-md bg-green-50 p-3">
          <div>
            <p className="text-sm font-medium text-green-800">
              {initialDomain.domain}
            </p>
            <p className="text-xs text-green-600">Verified and active</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}
    </div>
  );
}
