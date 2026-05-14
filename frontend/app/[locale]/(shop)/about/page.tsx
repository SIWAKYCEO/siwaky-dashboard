import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import AboutContent from "@/components/about/AboutContent";
import { buildPageMetadata, mergeLocaleShell } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props { params: { locale: string }; }

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta.about" });
  return mergeLocaleShell(
    locale,
    buildPageMetadata({
      locale,
      path: "/about",
      title: t("title"),
      description: t("description"),
      ogTitle: t("ogTitle"),
      ogDescription: t("ogDescription"),
      twitterTitle: t("twitterTitle"),
      twitterDescription: t("twitterDescription"),
    }),
  );
}

export default function AboutPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  return <AboutContent initialLang={locale === "en" ? "en" : "ar"} />;
}
