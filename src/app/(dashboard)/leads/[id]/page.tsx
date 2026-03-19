import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { scoreColor, leadStatusBadge, msgStatusColor } from "@/lib/ui-utils";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Fetch lead
  const { data: lead } = await supabase
    .from("leads")
    .select("*, campaign:campaigns(name)")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (!lead) notFound();

  // Fetch message timeline
  const { data: messages } = await supabase
    .from("messages_sent")
    .select("*, step:sequence_steps(step_number, channel, subject)")
    .eq("lead_id", id)
    .order("created_at", { ascending: true });


  const campaign = lead.campaign as { name: string } | null;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/leads" className="text-sm text-zinc-500 hover:text-zinc-900">
          &larr; Back to leads
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {lead.first_name ?? "Unknown"} {lead.last_name ?? ""}
        </h1>
      </div>

      {/* Lead info */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm">
        <div>
          <span className="text-zinc-500">Email</span>
          <p className="font-medium">{lead.email ?? "—"}</p>
        </div>
        <div>
          <span className="text-zinc-500">Phone</span>
          <p className="font-medium">{lead.phone ?? "—"}</p>
        </div>
        <div>
          <span className="text-zinc-500">AI Score</span>
          <p className={`text-lg font-bold ${scoreColor(lead.ai_score)}`}>
            {lead.ai_score ?? "—"}{lead.ai_score ? "/10" : ""}
          </p>
        </div>
        <div>
          <span className="text-zinc-500">Status</span>
          <p>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${leadStatusBadge(lead.status)}`}>
              {lead.status.replace("_", " ")}
            </span>
          </p>
        </div>
        <div>
          <span className="text-zinc-500">Campaign</span>
          <p className="font-medium">{campaign?.name ?? "—"}</p>
        </div>
        <div>
          <span className="text-zinc-500">Source</span>
          <p className="font-medium capitalize">{lead.source}</p>
        </div>
        <div className="col-span-2">
          <span className="text-zinc-500">Captured</span>
          <p className="font-medium">
            {new Date(lead.created_at).toLocaleString()}
          </p>
        </div>
        {lead.ai_score_reason && (
          <div className="col-span-2">
            <span className="text-zinc-500">Score Reason</span>
            <p className="mt-1 text-zinc-700">{lead.ai_score_reason}</p>
          </div>
        )}
      </div>

      {/* Message timeline */}
      <div>
        <h2 className="text-lg font-semibold">Message Timeline</h2>
        {!messages?.length ? (
          <p className="mt-3 text-sm text-zinc-400">No messages sent yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {messages.map((msg) => {
              const step = msg.step as {
                step_number: number;
                channel: string;
                subject: string | null;
              } | null;
              return (
                <div key={msg.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium uppercase">
                        {step?.channel ?? msg.channel ?? "—"}
                      </span>
                      {step && (
                        <span className="text-xs text-zinc-500">
                          Step {step.step_number}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-medium ${msgStatusColor(msg.status)}`}>
                      {msg.status}
                    </span>
                  </div>
                  {(step?.subject || msg.subject) && (
                    <p className="mt-2 text-sm font-medium">
                      {step?.subject ?? msg.subject}
                    </p>
                  )}
                  {msg.body && (
                    <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">
                      {msg.body}
                    </p>
                  )}
                  <div className="mt-2 flex gap-4 text-xs text-zinc-400">
                    {msg.sent_at && (
                      <span>Sent: {new Date(msg.sent_at).toLocaleString()}</span>
                    )}
                    {msg.delivered_at && (
                      <span>Delivered: {new Date(msg.delivered_at).toLocaleString()}</span>
                    )}
                    {msg.replied_at && (
                      <span>Replied: {new Date(msg.replied_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
