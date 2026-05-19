import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import HeroSection from "@/components/home/HeroSection";
import { buildPageMetadata, mergeLocaleShell } from "@/lib/seo/metadata";

// Below-fold sections — code-split to reduce initial JS payload
const BrandStory          = nextDynamic(() => import("@/components/home/BrandStory"));
const FlavorsSection      = nextDynamic(() => import("@/components/home/FlavorsSection"));
const ProductShowcase     = nextDynamic(() => import("@/components/home/ProductShowcase"));
const SunnahSection       = nextDynamic(() => import("@/components/home/SunnahSection"));
const StatsSection        = nextDynamic(() => import("@/components/home/StatsSection"));
const HalalCertSection    = nextDynamic(() => import("@/components/home/HalalCertSection"));
const TestimonialsSection = nextDynamic(() => import("@/components/home/TestimonialsSection"));
const FinalCTA            = nextDynamic(() => import("@/components/home/FinalCTA"));

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
