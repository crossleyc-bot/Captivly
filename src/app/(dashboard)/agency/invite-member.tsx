"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteMember() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/agency/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add member");
      }

      setEmail("");
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="member-email" className="block text-xs text-zinc-500">
          Email Address
        </label>
        <input
          id="member-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="team@example.com"
          className="mt-1 rounded-md border px-3 py-1.5 text-sm"
        />
      </div>
      <div>
        <label htmlFor="member-role" className="block text-xs text-zinc-500">
          Role
        </label>
        <select
          id="member-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-1 rounded-md border px-3 py-1.5 text-sm"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Member"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      {success && <p className="w-full text-sm text-green-600">Member added!</p>}
    </form>
  );
}
