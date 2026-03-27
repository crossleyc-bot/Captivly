import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ticketStatusBadge, ticketUrgencyColor } from "@/lib/ui-utils";
import type { SupportTicket } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!ticket) notFound();

  const t = ticket as SupportTicket;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/support"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          &larr; Back to Support
        </Link>
      </div>

      <div className="space-y-4 rounded-lg border p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">{t.subject}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`text-xs font-medium ${ticketUrgencyColor(t.urgency)}`}
            >
              {t.urgency}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${ticketStatusBadge(t.status)}`}
            >
              {t.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Submitted{" "}
          {new Date(t.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>

        <div className="border-t pt-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Message
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {t.message}
          </p>
        </div>
      </div>
    </div>
  );
}
