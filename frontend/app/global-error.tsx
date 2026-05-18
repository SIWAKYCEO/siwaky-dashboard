"use client";

import { useEffect } from "react";

/**
 * Catches errors in the root `app/layout.tsx` itself — must define full `<html>` / `<body>`.
 * https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console -- surfaced for dev diagnostics
    console.error("[app/global-error]", error?.digest ?? "", error);
  }, [error]);

  const message =
    typeof error?.message === "string" && error.message.trim().length > 0
      ? error.message
      : "An unexpected error occurred.";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#28282a",
          color: "#fafafa",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>Something went wrong</p>
          <p style={{ fontSize: "0.8125rem", maxWidth: "28rem", opacity: 0.85 }}>{message}</p>
          {error.digest ? (
            <p style={{ fontSize: "0.6875rem", opacity: 0.45, fontFamily: "ui-monospace, monospace" }}>
              Digest: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "0.5rem",
              cursor: "pointer",
              borderRadius: "1rem",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
              padding: "0.75rem 1.5rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
