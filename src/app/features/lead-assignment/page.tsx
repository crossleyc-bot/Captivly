import Link from "next/link";
import { Logo } from "@/components/logo";

export default function LeadAssignmentPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link href="/">
          <Logo size={24} />
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-teal-50 via-white to-white px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Lead Assignment Rules
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Automatically route leads to the right team member based on
              campaign, AI score, location, or round-robin. The right person
              follows up with the right lead — instantly.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-amber-200 hover:bg-teal-700"
              >
                Start Free Trial
              </Link>
              <Link
                href="/#features"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                All Features
              </Link>
            </div>
          </div>
        </section>

        {/* Why it matters */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              The right lead to the right person
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
              When every lead lands in a shared inbox, nobody owns it. Lead
              assignment rules ensure every lead has a clear owner from the
              moment it arrives.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-red-500">35%</div>
                <p className="mt-2 text-sm text-slate-600">
                  of leads go unfollowed when nobody is explicitly assigned.
                  Everyone assumes someone else will handle it.
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-teal-600">
                  Instant
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  assignment when a lead arrives. No manual triage, no
                  morning meeting to distribute leads, no cherry-picking.
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-green-600">2x</div>
                <p className="mt-2 text-sm text-slate-600">
                  faster follow-up when leads are auto-assigned vs manually
                  distributed by a manager each morning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Assignment methods */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Assignment methods
            </h2>
            <p className="mt-4 text-sm text-slate-600">
              Choose how leads get routed. Use one method or combine them
              with priority rules.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  By campaign
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Route leads from specific campaigns to specific team
                  members. Running a Google campaign and a Meta campaign?
                  Send Google leads to Alex and Meta leads to Jordan.
                </p>
                <div className="mt-4 rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-mono text-slate-500">
                    Campaign &quot;Google Search - Gym&quot; → Alex
                  </p>
                  <p className="text-xs font-mono text-slate-500">
                    Campaign &quot;Meta - Free Trial&quot; → Jordan
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  By AI score
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Route high-value leads to your best closer. Leads scoring
                  8+ go to your senior sales rep, while 5–7 go to the team
                  for general follow-up.
                </p>
                <div className="mt-4 rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-mono text-slate-500">
                    Score 8–10 → Sarah (senior sales)
                  </p>
                  <p className="text-xs font-mono text-slate-500">
                    Score 5–7 → Round-robin team
                  </p>
                  <p className="text-xs font-mono text-slate-500">
                    Score 1–4 → Nurture sequence only
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  By location
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  If you have multiple locations or service areas, route
                  leads based on their zip code or city. Each location&apos;s
                  staff only sees leads in their area.
                </p>
                <div className="mt-4 rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-mono text-slate-500">
                    ZIP 78701–78759 → Downtown team
                  </p>
                  <p className="text-xs font-mono text-slate-500">
                    ZIP 78660–78681 → North location
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Round-robin
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Distribute leads evenly across your team. Each new lead
                  goes to the next person in rotation. Fair, simple, and
                  ensures nobody is overloaded or underutilized.
                </p>
                <div className="mt-4 rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-mono text-slate-500">
                    Lead 1 → Alex → Lead 2 → Jordan → Lead 3 → Sarah → ...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Example rules */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              Example rule configuration
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-sm text-slate-600">
              Rules are evaluated in order. The first matching rule assigns
              the lead. If no rules match, the default assignment applies.
            </p>
            <div className="mt-12 space-y-3">
              {[
                {
                  priority: 1,
                  condition: "AI score ≥ 8",
                  action: "Assign to Sarah (senior sales)",
                  note: "High-value leads get the best closer",
                },
                {
                  priority: 2,
                  condition: "Campaign = \"Google Search\"",
                  action: "Assign to Alex",
                  note: "Alex specializes in search-intent leads",
                },
                {
                  priority: 3,
                  condition: "ZIP starts with 786",
                  action: "Assign to Downtown team",
                  note: "Location-based routing",
                },
                {
                  priority: 4,
                  condition: "Default (no match)",
                  action: "Round-robin: Jordan, Mike, Lisa",
                  note: "Even distribution for everything else",
                },
              ].map((rule) => (
                <div
                  key={rule.priority}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    {rule.priority}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">
                        IF {rule.condition}
                      </span>
                      <span className="text-xs text-slate-400">→</span>
                      <span className="text-sm font-medium text-slate-900">
                        {rule.action}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{rule.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Assignment features
            </h2>
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Instant notifications
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  When a lead is assigned, the team member gets an immediate
                  email and in-app notification with the lead&apos;s details.
                  No delays, no checking a shared inbox.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Reassignment
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Managers and Owners can reassign any lead with one click.
                  If a team member is out sick or a lead needs special
                  attention, just move it to someone else.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Capacity limits
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Set a maximum number of active leads per team member. Once
                  someone hits their cap, new leads skip them in the rotation
                  until they convert or close existing leads.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Assignment analytics
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  See conversion rates per team member. Who closes the most
                  leads? Who has the fastest response time? Use data to
                  optimize your assignment rules over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-white px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900">
              Every lead gets an owner
            </h2>
            <p className="mt-4 text-slate-600">
              No more leads slipping through the cracks. Auto-assign based on
              the rules that make sense for your team.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-amber-200 hover:bg-teal-700"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Captivly.ai. All rights reserved.
      </footer>
    </div>
  );
}
