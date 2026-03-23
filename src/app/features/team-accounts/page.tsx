import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "Team Member Accounts",
  description:
    "Let your front desk, sales reps, and managers access leads without sharing the owner login. Role-based access control.",
  openGraph: {
    title: "Team Member Accounts - Captivly.ai",
    description:
      "Role-based access for front desk, sales reps, and managers.",
    url: "https://captivly.ai/features/team-accounts",
  },
};

export default function TeamAccountsPage() {
  return (
    <FeatureLayout
      title="Team Member Accounts"
      description="Let your front desk, sales reps, and managers access leads without sharing the owner login. Everyone gets the access they need — nothing more, nothing less."
      ctaHeading="Give your team the access they need"
      ctaDescription={'No more shared logins. No more "can you check that lead for me?" texts. Everyone gets their own account with the right level of access.'}
    >
      {/* The problem */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Stop sharing your password
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
            When your front desk needs to check a lead&apos;s status, they
            shouldn&apos;t log in as you. Shared logins create security
            risks, no audit trail, and no way to control who sees what.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-red-500">73%</div>
              <p className="mt-2 text-sm text-slate-600">
                of small businesses share login credentials between staff
                — a security risk and an operational headache
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600">0</div>
              <p className="mt-2 text-sm text-slate-600">
                audit trail when everyone uses the same login. Who changed
                that lead status? Who sent that message? No idea.
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                &lt;1 min
              </div>
              <p className="mt-2 text-sm text-slate-600">
                to invite a team member. Enter their email, pick a role,
                done. They get their own login immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            Role-based access
          </h2>
          <p className="mt-4 text-sm text-slate-600">
            Three roles cover the needs of any local business team.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                  <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Owner
                </h3>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Full access to everything: billing, settings, campaigns,
                leads, sequences, analytics, and team management. Only the
                account creator starts as Owner.
              </p>
              <div className="mt-4 space-y-1.5">
                {[
                  "Manage billing & subscription",
                  "Invite & remove team members",
                  "Access all campaigns & leads",
                  "Configure integrations",
                  "View analytics & reports",
                ].map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center gap-2 text-xs text-slate-600"
                  >
                    <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {perm}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                  <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Manager
                </h3>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Access to campaigns, leads, sequences, and analytics.
                Can manage lead statuses, send messages, and view
                performance — but no billing or team management.
              </p>
              <div className="mt-4 space-y-1.5">
                {[
                  "Access all campaigns & leads",
                  "Update lead statuses",
                  "Send manual messages",
                  "View analytics & reports",
                  "Create & edit sequences",
                ].map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center gap-2 text-xs text-slate-600"
                  >
                    <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {perm}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Staff
                </h3>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                View-only access to assigned leads. Perfect for front desk
                staff who need to check lead info or see upcoming
                appointments — without changing anything.
              </p>
              <div className="mt-4 space-y-1.5">
                {[
                  "View assigned leads only",
                  "See lead contact info",
                  "View message timeline",
                  "Add notes to leads",
                ].map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center gap-2 text-xs text-slate-600"
                  >
                    <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {perm}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-4">
            {[
              {
                step: "1",
                title: "Invite",
                description:
                  "Go to Settings → Team. Enter their email and select a role (Manager or Staff).",
              },
              {
                step: "2",
                title: "Accept",
                description:
                  "They receive an email invitation with a link to create their account and set a password.",
              },
              {
                step: "3",
                title: "Access",
                description:
                  "They log in and see only what their role allows. Staff see assigned leads. Managers see everything except billing.",
              },
              {
                step: "4",
                title: "Audit",
                description:
                  "Every action is logged with the user's name. You always know who did what and when.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                  {item.step}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            Team features
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Activity log
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                See a timestamped log of every action taken by every team
                member. &quot;Sarah marked lead #142 as converted at
                3:42pm.&quot; Full accountability with zero micromanaging.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Per-member lead assignment
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Assign specific leads to specific team members. Staff only
                see their assigned leads — no information overload. Pair
                this with lead assignment rules for automatic routing.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Notification preferences
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Each team member controls their own notification settings.
                The sales rep gets notified on new high-score leads. The
                front desk gets notified on upcoming appointments.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Easy removal
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                When someone leaves, remove their access with one click.
                Their assigned leads are automatically unassigned and
                returned to the pool. No password changes needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team size by plan */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Team seats by plan
          </h2>
          <div className="mt-12 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-slate-500">
                  <th className="pb-3 pr-4">Plan</th>
                  <th className="pb-3 pr-4">Team members</th>
                  <th className="pb-3 pr-4">Roles available</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    Starter
                  </td>
                  <td className="py-3 pr-4 text-slate-600">1 (owner only)</td>
                  <td className="py-3 pr-4 text-slate-600">Owner</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    Growth
                  </td>
                  <td className="py-3 pr-4 text-slate-600">Up to 5</td>
                  <td className="py-3 pr-4 text-slate-600">
                    Owner, Manager, Staff
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    Pro
                  </td>
                  <td className="py-3 pr-4 text-slate-600">Unlimited</td>
                  <td className="py-3 pr-4 text-slate-600">
                    Owner, Manager, Staff
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
