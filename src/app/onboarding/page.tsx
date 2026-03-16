export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg space-y-6 px-4">
        <h1 className="text-2xl font-bold">Set up your business</h1>
        <p className="text-zinc-500">
          Complete these steps to start generating leads automatically.
        </p>
        <div className="space-y-3">
          {[
            "Business basics",
            "Target audience",
            "Primary offer",
            "Connect Meta",
            "Choose plan",
          ].map((step, i) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-md border px-4 py-3"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium">
                {i + 1}
              </span>
              <span className="text-sm font-medium">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
