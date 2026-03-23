export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-7 w-40 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 rounded bg-slate-100" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border px-4 py-3">
            <div className="-mx-4 -mt-3 mb-3 h-1 bg-slate-200" />
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="mt-2 h-7 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Usage section skeleton */}
      <div>
        <div className="h-5 w-36 rounded bg-slate-200" />
        <div className="mt-1 h-4 w-24 rounded bg-slate-100" />
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-12 rounded bg-slate-200" />
                <div className="h-4 w-20 rounded bg-slate-200" />
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent leads skeleton */}
      <div>
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 rounded bg-slate-200" />
          <div className="h-4 w-16 rounded bg-slate-100" />
        </div>
        <div className="mt-3 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b pb-3 last:border-0">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="h-4 w-8 rounded bg-slate-200" />
              <div className="h-5 w-16 rounded-full bg-slate-100" />
              <div className="h-4 w-20 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
