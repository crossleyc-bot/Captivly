"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface WebhookActionsProps {
  id: string;
  status: string;
  retryCount: number;
}

export function WebhookActions({ id, status, retryCount }: WebhookActionsProps) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const canRetry = status === "pending" && retryCount < 5;
  const canDismiss = status === "pending";

  async function handleRetry() {
    setRetrying(true);
    try {
      const res = await fetch("/api/webhooks/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dead_letter_id: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Retry failed");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setRetrying(false);
      router.refresh();
    }
  }

  async function handleDismiss() {
    setDismissing(true);
    try {
      const res = await fetch("/api/webhooks/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dead_letter_id: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Dismiss failed");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDismissing(false);
      router.refresh();
    }
  }

  if (status !== "pending") {
    return (
      <span className="text-xs text-slate-400">
        {status === "processed" ? "Resolved" : "Dismissed"}
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      {canRetry && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {retrying ? "Retrying..." : "Retry"}
        </button>
      )}
      {canDismiss && (
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {dismissing ? "Dismissing..." : "Dismiss"}
        </button>
      )}
    </div>
  );
}
