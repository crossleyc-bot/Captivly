import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WebhookActions } from "./webhook-actions";

interface DeadLetterRow {
  id: string;
  source: string;
  error_message: string | null;
  status: string;
  retry_count: number;
  created_at: string;
}

const SOURCE_BADGES: Record<string, string> = {
  meta: "bg-blue-100 text-blue-700",
  google: "bg-red-100 text-red-700",
  tiktok: "bg-slate-100 text-slate-700",
  linkedin: "bg-blue-100 text-blue-700",
};

const STATUS_BADGES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-600",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  return "just now";
}

export default async function WebhookLogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  const { data: deadLetters } = await supabase
    .from("webhook_dead_letters")
    .select("id, source, error_message, status, retry_count, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const entries = (deadLetters ?? []) as DeadLetterRow[];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhook Logs</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and retry failed webhook deliveries from the dead letter queue.
          </p>
        </div>
        <Link
          href="/settings"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Settings
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
          <p className="text-sm text-slate-500">
            No failed webhook deliveries. Everything is running smoothly.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-slate-500">
                <th className="pb-2 pr-4">Source</th>
                <th className="pb-2 pr-4">Error</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Retries</th>
                <th className="pb-2 pr-4">Created</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_BADGES[entry.source] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {entry.source}
                    </span>
                  </td>
                  <td className="py-2 pr-4 max-w-xs">
                    <span className="text-slate-600 truncate block max-w-xs" title={entry.error_message ?? ""}>
                      {entry.error_message
                        ? entry.error_message.length > 60
                          ? entry.error_message.slice(0, 60) + "..."
                          : entry.error_message
                        : "Unknown error"}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[entry.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-600">
                    {entry.retry_count}/5
                  </td>
                  <td className="py-2 pr-4 text-xs text-slate-500">
                    {relativeTime(entry.created_at)}
                  </td>
                  <td className="py-2">
                    <WebhookActions
                      id={entry.id}
                      status={entry.status}
                      retryCount={entry.retry_count}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
