import Link from "next/link";

/** Root `not-found` — rendered inside `app/layout.tsx` (no `<html>` / `<body>` wrapper). */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-dark px-6 py-16 text-white">
      <div className="text-center">
        <p className="font-display text-7xl text-brand-goldLight">404</p>
        <h1 className="mt-4 font-display text-3xl">الصفحة غير موجودة</h1>
        <p className="mx-auto mt-3 max-w-md text-[13px] text-white/55">
          Page not found — if you were looking for the operator dashboard, use the link below.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/ar" className="btn-ghost-gold inline-flex">
            العودة للرئيسية
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
