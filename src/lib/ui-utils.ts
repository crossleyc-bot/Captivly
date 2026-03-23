/** Color class for AI lead scores (1-10). */
export function scoreColor(score: number | null): string {
  if (!score) return "text-slate-400";
  if (score >= 8) return "text-green-600";
  if (score >= 5) return "text-yellow-600";
  return "text-red-500";
}

/** Badge classes for lead statuses. */
export function leadStatusBadge(status: string): string {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    in_sequence: "bg-purple-100 text-purple-700",
    replied: "bg-green-100 text-green-700",
    converted: "bg-emerald-100 text-emerald-700",
    cold: "bg-slate-100 text-slate-600",
    unsubscribed: "bg-red-100 text-red-600",
  };
  return colors[status] ?? "bg-slate-100 text-slate-600";
}

/** Badge classes for campaign statuses. */
export function campaignStatusBadge(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-blue-100 text-blue-700",
  };
  return colors[status] ?? "bg-slate-100 text-slate-600";
}

/** Badge classes for deal activity types. */
export function dealActivityBadge(type: string): string {
  const colors: Record<string, string> = {
    stage_change: "bg-blue-100 text-blue-700",
    note: "bg-slate-100 text-slate-700",
    created: "bg-green-100 text-green-700",
    closed: "bg-emerald-100 text-emerald-700",
  };
  return colors[type] ?? "bg-slate-100 text-slate-600";
}

/** Format cents as dollar string. */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Color class for message delivery statuses. */
export function msgStatusColor(status: string): string {
  const colors: Record<string, string> = {
    queued: "text-slate-500",
    sent: "text-blue-600",
    delivered: "text-green-600",
    failed: "text-red-600",
    replied: "text-emerald-600",
  };
  return colors[status] ?? "text-slate-500";
}

/** Badge classes for support ticket statuses. */
export function ticketStatusBadge(status: string): string {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-slate-100 text-slate-600",
  };
  return colors[status] ?? "bg-slate-100 text-slate-600";
}

/** Color class for support ticket urgency. */
export function ticketUrgencyColor(urgency: string): string {
  const colors: Record<string, string> = {
    low: "text-slate-500",
    medium: "text-yellow-600",
    high: "text-red-600",
  };
  return colors[urgency] ?? "text-slate-500";
}
