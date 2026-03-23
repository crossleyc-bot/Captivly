export default function SequencesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-32 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
      </div>

      {/* Sequence cards skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-5 w-44 rounded bg-slate-200" />
                <div className="mt-1 h-3 w-28 rounded bg-slate-100" />
              </div>
              <div className="h-4 w-14 rounded bg-slate-100" />
            </div>
            <div className="mt-3 space-y-1">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 rounded bg-slate-50 px-3 py-2">
                  <div className="h-5 w-6 rounded bg-slate-200" />
                  <div className="h-5 w-12 rounded bg-slate-200" />
                  <div className="h-4 w-14 rounded bg-slate-100" />
                  <div className="h-4 w-32 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
