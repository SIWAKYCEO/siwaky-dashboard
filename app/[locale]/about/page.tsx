import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import AboutContent from "@/components/about/AboutContent";

interface Props { params: { locale: string }; }

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta.about" });
  return { title: t("title"), description: t("description") };
}

export default function AboutPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  return <AboutContent initialLang={locale === "en" ? "en" : "ar"} />;
}
