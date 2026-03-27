"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            We've been notified and are looking into it.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: "#0f172a",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
