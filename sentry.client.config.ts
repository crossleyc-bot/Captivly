import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
  replaysSessionSampleRate: 0, // Disable session replay
  replaysOnErrorSampleRate: 0.1, // 10% of error sessions
  environment: process.env.NODE_ENV,

  // Don't send PII
  sendDefaultPii: false,

  // Filter out noisy errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Network request failed",
    "Load failed",
    "AbortError",
  ],
});
