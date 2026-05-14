import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import ThankYouContent from "@/components/thank-you/ThankYouContent";
import { buildPageMetadata, mergeLocaleShell } from "@/lib/seo/metadata";

/** Avoid stale HTML at CDN/host — thank-you must reflect latest messages & UI after deploy. */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

interface Props { params: { locale: string }; }

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  noStore();
  const t = await getTranslations({ locale, namespace: "meta.thankYou" });
  return mergeLocaleShell(
    locale,
    buildPageMetadata({
      locale,
      path: "/thank-you",
      title: t("title"),
      description: t("description"),
      robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
    }),
  );
}

export default function ThankYouPage({ params: { locale } }: Props) {
  noStore();
  unstable_setRequestLocale(locale);
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-brand-dark" aria-hidden />}>
      <ThankYouContent />
    </Suspense>
  );
}
