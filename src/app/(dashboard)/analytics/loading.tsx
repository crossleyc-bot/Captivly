export default function AnalyticsLoading() {
  return (
    <div className="max-w-3xl space-y-8 animate-pulse">
      <div>
        <div className="h-7 w-28 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-56 rounded bg-slate-100" />
      </div>

      {/* Usage meters skeleton */}
      <section className="space-y-3">
        <div className="h-5 w-36 rounded bg-slate-200" />
        <div className="space-y-4 rounded-lg border p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="flex justify-between">
                <div className="h-3 w-12 rounded bg-slate-200" />
                <div className="h-3 w-20 rounded bg-slate-200" />
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </section>

      {/* Key metrics skeleton */}
      <section className="space-y-3">
        <div className="h-5 w-28 rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border px-4 py-3">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="mt-2 h-7 w-12 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </section>

      {/* Lead status breakdown skeleton */}
      <section className="space-y-3">
        <div className="h-5 w-44 rounded bg-slate-200" />
        <div className="rounded-lg border p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-4 w-8 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
