import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SubmitTicketForm } from "./submit-ticket-form";
import { ticketStatusBadge, ticketUrgencyColor } from "@/lib/ui-utils";
import type { SupportTicket } from "@/types/database";

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const typedTickets = (tickets ?? []) as SupportTicket[];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit a support ticket or view your existing requests.
        </p>
      </div>

      <SubmitTicketForm />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Your Tickets</h2>

        {typedTickets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
            <p className="text-sm text-slate-500">No support tickets yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {typedTickets.map((ticket) => (
              <Link key={ticket.id} href={`/support/${ticket.id}`} className="block rounded-lg border px-4 py-3 transition-colors hover:border-slate-400 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{ticket.subject}</p>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{ticket.message}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`text-xs font-medium ${ticketUrgencyColor(ticket.urgency)}`}>
                      {ticket.urgency}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ticketStatusBadge(ticket.status)}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(ticket.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
