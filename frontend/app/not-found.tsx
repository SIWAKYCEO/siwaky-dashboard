import Link from "next/link";

/** Root `not-found` — rendered inside `app/layout.tsx` (no `<html>` / `<body>` wrapper). */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#28282a] px-6 py-16 text-white">
      <div className="text-center">
        <p className="text-7xl text-[#c9a962]">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-[13px] text-white/55">
          Go back to the orders dashboard or sign in again.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex rounded-full border border-[#c9a962]/35 bg-black/35 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/85 hover:bg-black/55"
          >
            Dashboard home
          </Link>
          <Link
            href="/dashboard/login"
            className="inline-flex rounded-full border border-white/15 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/78 hover:bg-white/[0.06]"
          >
            Dashboard sign-in
          </Link>
        </div>
      </div>
    </div>
  );
}
