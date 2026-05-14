import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-screen items-center justify-center bg-brand-dark text-white">
        <div className="text-center">
          <p className="font-display text-7xl text-brand-goldLight">404</p>
          <h1 className="mt-4 font-display text-3xl">الصفحة غير موجودة</h1>
          <Link href="/ar" className="btn-ghost-gold mt-8 inline-flex">
            العودة للرئيسية
          </Link>
        </div>
      </body>
    </html>
  );
}
