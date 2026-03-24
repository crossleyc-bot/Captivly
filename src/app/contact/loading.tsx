export default function ContactLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header skeleton */}
      <div className="h-16 border-b bg-white" />

      <main className="flex-1 px-6 py-20">
        <div className="mx-auto max-w-lg animate-pulse space-y-6">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-100" />

          <div className="mt-8 space-y-4">
            <div className="space-y-2">
              <div className="h-3 w-12 rounded bg-slate-200" />
              <div className="h-9 w-full rounded bg-slate-100" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-12 rounded bg-slate-200" />
              <div className="h-9 w-full rounded bg-slate-100" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-slate-200" />
              <div className="h-28 w-full rounded bg-slate-100" />
            </div>
            <div className="h-9 w-32 rounded bg-slate-200" />
          </div>
        </div>
      </main>
    </div>
  );
}
