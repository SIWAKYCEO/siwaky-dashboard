import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import HeroSection from "@/components/home/HeroSection";
import BrandStory from "@/components/home/BrandStory";
import FlavorsSection from "@/components/home/FlavorsSection";
import ProductShowcase from "@/components/home/ProductShowcase";
import SunnahSection from "@/components/home/SunnahSection";
import StatsSection from "@/components/home/StatsSection";
import HalalCertSection from "@/components/home/HalalCertSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FinalCTA from "@/components/home/FinalCTA";
import { buildPageMetadata, mergeLocaleShell } from "@/lib/seo/metadata";

/** Always fresh HTML after deploy — avoid Next full-route / CDN serving stale homepage shells. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return mergeLocaleShell(
    locale,
    buildPageMetadata({
      locale,
      path: "",
      title: t("title"),
      description: t("description"),
      ogTitle: t("ogTitle"),
      ogDescription: t("ogDescription"),
      twitterTitle: t("twitterTitle"),
      twitterDescription: t("twitterDescription"),
    }),
  );
}

export default function HomePage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  return (
    <>
      <HeroSection />
      <BrandStory />
      <FlavorsSection />
      <ProductShowcase />
      <SunnahSection />
      <StatsSection />
      <HalalCertSection />
      <TestimonialsSection />
      <FinalCTA />
    </>
  );
}
