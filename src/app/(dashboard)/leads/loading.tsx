export default function LeadsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-24 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-56 rounded bg-slate-100" />
      </div>

      {/* Table header skeleton */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 border-b pb-2">
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="h-3 w-12 rounded bg-slate-200" />
          <div className="h-3 w-14 rounded bg-slate-200" />
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="h-3 w-14 rounded bg-slate-200" />
        </div>

        {/* Table rows skeleton */}
        <div className="space-y-3 pt-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b pb-3 last:border-0">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-4 w-8 rounded bg-slate-200" />
              <div className="h-5 w-16 rounded-full bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-4 w-20 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
