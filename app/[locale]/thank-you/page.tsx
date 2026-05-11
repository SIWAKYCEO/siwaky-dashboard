import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import ThankYouContent from "@/components/thank-you/ThankYouContent";

interface Props { params: { locale: string }; }

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta.thankYou" });
  return { title: t("title"), description: t("description"), robots: { index: false } };
}

export default function ThankYouPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  return (
    <Suspense>
      <ThankYouContent />
    </Suspense>
  );
}
