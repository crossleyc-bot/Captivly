export default function SupportLoading() {
  return (
    <div className="max-w-3xl space-y-8 animate-pulse">
      <div>
        <div className="h-7 w-28 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 rounded bg-slate-100" />
      </div>

      {/* Submit ticket form skeleton */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="h-5 w-36 rounded bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="h-9 w-full rounded bg-slate-100" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="h-9 w-full rounded bg-slate-100" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="h-24 w-full rounded bg-slate-100" />
        </div>
        <div className="h-9 w-32 rounded bg-slate-200" />
      </div>

      {/* Tickets list skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-28 rounded bg-slate-200" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-100" />
              </div>
              <div className="flex gap-2">
                <div className="h-4 w-12 rounded bg-slate-100" />
                <div className="h-5 w-14 rounded-full bg-slate-100" />
              </div>
            </div>
            <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
