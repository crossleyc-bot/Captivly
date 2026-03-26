"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithCsrf } from "@/lib/fetch-with-csrf";

export function AddClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [foundBusiness, setFoundBusiness] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);
  const [searchStep, setSearchStep] = useState<"search" | "confirm">("search");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    setFoundBusiness(null);

    try {
      const res = await fetchWithCsrf(
        `/api/agency/clients/lookup?email=${encodeURIComponent(email.trim())}`,
        { method: "GET" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to look up business");
      }

      const data = await res.json();
      if (data.business) {
        setFoundBusiness(data.business);
        setSearchStep("confirm");
      } else {
        setError("No business found for that email. The user must complete onboarding first.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!foundBusiness) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetchWithCsrf("/api/agency/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: foundBusiness.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add client");
      }

      setSuccess(true);
      setEmail("");
      setFoundBusiness(null);
      setSearchStep("search");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setFoundBusiness(null);
    setSearchStep("search");
    setError(null);
  }

  return (
    <div className="space-y-3">
      {searchStep === "search" && (
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="client-email" className="block text-xs text-slate-500">
              Client Email
            </label>
            <input
              id="client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Find Business"}
          </button>
        </form>
      )}

      {searchStep === "confirm" && foundBusiness && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">Business found:</p>
          <p className="mt-1 text-sm text-blue-800">
            {foundBusiness.name}{" "}
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
              {foundBusiness.type}
            </span>
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={loading}
              className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add to Agency"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Client added to your agency!</p>}
    </div>
  );
}
