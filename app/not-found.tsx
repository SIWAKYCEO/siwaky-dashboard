import Link from "next/link";

/** Rendered inside `app/layout.tsx` — do not wrap in `<html>` / `<body>`. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-dark px-6 py-16 text-white">
      <div className="text-center">
        <p className="font-display text-7xl text-brand-goldLight">404</p>
        <h1 className="mt-4 font-display text-3xl">الصفحة غير موجودة</h1>
        <Link href="/ar" className="btn-ghost-gold mt-8 inline-flex">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
