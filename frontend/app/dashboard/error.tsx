"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Dashboard segment error boundary — scoped to `/dashboard` routes.
 * https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console -- surfaced for dev diagnostics
    console.error("[app/dashboard/error]", error?.digest ?? "", error);
  }, [error]);

  const message =
    typeof error?.message === "string" && error.message.trim().length > 0
      ? error.message
      : "An unexpected error occurred while loading the dashboard.";

  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ backgroundColor: "#28282a", color: "#fafafa" }}
      dir="ltr"
    >
      <p className="font-medium text-white">Dashboard error</p>
      <p className="max-w-md text-[13px] text-rose-100/90">{message}</p>
      {error.digest ? (
        <p className="font-mono text-[11px] text-white/35">Digest: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-2xl border border-white/20 bg-black/35 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-white/15"
        >
          Try again
        </button>
        <Link
          href="/dashboard/login"
          className="rounded-2xl border border-[#c9a962]/35 bg-black/25 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#ebe2c9] hover:bg-black/40"
        >
          Sign in again
        </Link>
      </div>
    </div>
  );
}
