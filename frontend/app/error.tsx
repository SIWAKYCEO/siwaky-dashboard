"use client";

import { useEffect } from "react";

/**
 * Root segment error boundary — catches errors in routes under `app/layout.tsx`.
 * https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console -- surfaced for dev diagnostics
    console.error("[app/error]", error?.digest ?? "", error);
  }, [error]);

  const message =
    typeof error?.message === "string" && error.message.trim().length > 0
      ? error.message
      : "An unexpected error occurred.";

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ backgroundColor: "#28282a", color: "#fafafa" }}
      dir="ltr"
    >
      <p className="text-lg font-semibold tracking-tight">Something went wrong</p>
      <p className="max-w-md text-[13px] text-white/80">{message}</p>
      {error.digest ? (
        <p className="font-mono text-[11px] text-white/35">Digest: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-2xl border border-white/20 bg-black/35 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-white/15"
      >
        Try again
      </button>
    </div>
  );
}
