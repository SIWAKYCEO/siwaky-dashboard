"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Dashboard error boundary:", error);
  }, [error]);

  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ backgroundColor: "#28282a", color: "#fef2f2" }}
      dir="ltr"
    >
      <p className="font-medium text-white">Si è verificato un errore nel dashboard.</p>
      <p className="max-w-md text-[13px] text-rose-200/90">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-2xl border border-white/20 bg-black/35 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-white/15"
      >
        Riprova
      </button>
    </div>
  );
}
