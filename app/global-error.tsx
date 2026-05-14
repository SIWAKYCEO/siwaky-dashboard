"use client";

import { useEffect } from "react";

/**
 * Must define its own <html> and <body>; used when the root layout fails.
 * Keep styles minimal (no reliance on globals).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Root error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", backgroundColor: "#28282a", color: "#fafafa" }}>
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
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>Something went wrong</p>
          <p style={{ fontSize: "0.8125rem", maxWidth: "28rem", opacity: 0.85 }}>{error.message}</p>
          <button
            type="button"
            onClick={reset}
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
