import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SequencesPage() {
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

  const { data: sequences } = await supabase
    .from("sequences")
    .select("id, name, is_active, created_at, campaign:campaigns(name), sequence_steps(id, step_number, channel, subject, delay_days)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sequences</h1>
        <p className="mt-1 text-sm text-slate-500">
          View your AI-generated outreach sequences.
        </p>
      </div>

      {!sequences?.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-600">No sequences yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Sequences are auto-generated when you create a campaign.
          </p>
          <Link
            href="/campaigns/new"
            className="mt-4 inline-block rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Create a campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sequences.map((seq) => {
            const campaign = seq.campaign as unknown as { name: string } | null;
            const steps = (seq.sequence_steps ?? []) as Array<{
              id: string;
              step_number: number;
              channel: string;
              subject: string | null;
              delay_days: number;
            }>;
            return (
              <div key={seq.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{seq.name}</h3>
                    {campaign && (
                      <p className="text-xs text-slate-500">Campaign: {campaign.name}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      seq.is_active ? "text-green-600" : "text-slate-400"
                    }`}
                  >
                    {seq.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {steps.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {steps
                      .sort((a, b) => a.step_number - b.step_number)
                      .map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 rounded bg-slate-50 px-3 py-2 text-sm"
                        >
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium">
                            {step.step_number}
                          </span>
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs uppercase">
                            {step.channel}
                          </span>
                          <span className="text-slate-500">Day {step.delay_days}</span>
                          {step.subject && (
                            <span className="truncate text-slate-700">{step.subject}</span>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
