import type { Metadata } from "next";
import Script from "next/script";
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
  console.log("SIWAKY BUILD VERSION 3.0");
  return (
    <>
      <div
        className="sticky top-0 z-[9999] w-full bg-yellow-400 py-2 text-center text-sm font-bold uppercase tracking-wide text-black"
        data-siwaky-build="3.0"
        role="status"
      >
        VERSION 3.0
      </div>
      <Script id="siwaky-build-version-30" strategy="afterInteractive">
        {`console.log('SIWAKY BUILD VERSION 3.0');`}
      </Script>
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
