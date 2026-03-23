"use client";

export function DashboardMockup() {
  return (
    <div className="relative">
      {/* Glow effect behind the mockup */}
      <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-indigo-200/40 via-transparent to-amber-200/30 blur-2xl" />

      {/* Browser chrome */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="mx-auto flex h-5 w-48 items-center justify-center rounded bg-slate-100 text-[10px] text-slate-400">
            app.captivly.ai/dashboard
          </div>
        </div>

        {/* Dashboard content */}
        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden w-36 border-r border-slate-100 bg-slate-50/50 p-3 sm:block">
            <div className="mb-4 flex items-center gap-1.5">
              <div className="h-4 w-4 rounded bg-indigo-600" />
              <span className="text-[10px] font-bold text-slate-700">Captivly</span>
            </div>
            <div className="space-y-1">
              {["Dashboard", "Campaigns", "Leads", "Sequences", "Analytics"].map(
                (item, i) => (
                  <div
                    key={item}
                    className={`rounded px-2 py-1 text-[9px] font-medium ${
                      i === 0
                        ? "bg-slate-900 text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Main area */}
          <div className="flex-1 p-3 sm:p-4">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "New Leads", value: "47", trend: "+12%", color: "text-indigo-600" },
                { label: "In Sequence", value: "128", trend: "+8%", color: "text-purple-600" },
                { label: "Replied", value: "34", trend: "+23%", color: "text-green-600" },
                { label: "Converted", value: "19", trend: "+15%", color: "text-emerald-600" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-md border border-slate-100 p-2"
                >
                  <p className="text-[8px] text-slate-400">{stat.label}</p>
                  <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[8px] text-green-500">{stat.trend}</p>
                </div>
              ))}
            </div>

            {/* Recent leads table */}
            <div className="mt-3 rounded-md border border-slate-100">
              <div className="border-b border-slate-50 px-3 py-1.5">
                <span className="text-[9px] font-semibold text-slate-700">
                  Recent Leads
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {[
                  { name: "Sarah M.", score: 9, status: "In Sequence", statusColor: "bg-purple-100 text-purple-700", time: "2m ago" },
                  { name: "James R.", score: 7, status: "New", statusColor: "bg-blue-100 text-blue-700", time: "8m ago" },
                  { name: "Lisa K.", score: 10, status: "Replied", statusColor: "bg-green-100 text-green-700", time: "14m ago" },
                  { name: "Mike T.", score: 6, status: "In Sequence", statusColor: "bg-purple-100 text-purple-700", time: "22m ago" },
                ].map((lead) => (
                  <div
                    key={lead.name}
                    className="flex items-center justify-between px-3 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[8px] font-medium text-slate-600">
                        {lead.name[0]}
                      </div>
                      <span className="text-[10px] font-medium text-slate-700">
                        {lead.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold ${lead.score >= 8 ? "text-green-600" : "text-yellow-600"}`}>
                        {lead.score}/10
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[7px] font-medium ${lead.statusColor}`}>
                        {lead.status}
                      </span>
                      <span className="text-[8px] text-slate-400">{lead.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live activity indicator */}
            <div className="mt-2 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-[8px] text-slate-400">
                Live — 3 new leads in the last hour
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
