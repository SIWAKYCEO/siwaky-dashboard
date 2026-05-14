/**
 * ACTIVE PRODUCT PDP — Next.js resolves ONLY this file for `/[locale]/product`.
 * Route: `app/[locale]/(shop)/product/page.tsx` — `(shop)` is invisible in the URL.
 * There must NOT be a second `app/[locale]/product/page.tsx` or builds conflict.
 */
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import ProductHero from "@/components/product/ProductHero";
import ProductBenefits from "@/components/product/ProductBenefits";
import Ingredients from "@/components/product/Ingredients";
import HowToUse from "@/components/product/HowToUse";
import ProductComparisonTable from "@/components/product/ProductComparisonTable";
import ReviewsSection from "@/components/product/ReviewsSection";
import FAQSection from "@/components/product/FAQSection";
import ProductFinalCTA from "@/components/product/ProductFinalCTA";
import ProductDeployProbe from "@/components/product/ProductDeployProbe";
import ProductSectionDivider from "@/components/product/ProductSectionDivider";
import ProductViewedTracker from "@/components/product/ProductViewedTracker";
import ProductJsonLd from "@/components/seo/ProductJsonLd";
import { buildPageMetadata, mergeLocaleShell } from "@/lib/seo/metadata";

/** Bypass Full Route Cache & stale CDN/HTML caching — always render fresh product PDP. */
export const dynamic = "force-dynamic";
export const revalidate = 0;
/** Default for any `fetch` in this segment tree — equivalent intent to `cache: 'no-store'`. */
export const fetchCache = "default-no-store";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  noStore();
  const t = await getTranslations({ locale, namespace: "meta.product" });
  return mergeLocaleShell(
    locale,
    buildPageMetadata({
      locale,
      path: "/product",
      title: t("title"),
      description: t("description"),
      ogTitle: t("ogTitle"),
      ogDescription: t("ogDescription"),
      twitterTitle: t("twitterTitle"),
      twitterDescription: t("twitterDescription"),
    }),
  );
}

export default function ProductPage({ params: { locale } }: Props) {
  noStore();
  unstable_setRequestLocale(locale);
  return (
    <>
      {/* HTML source marker — View Page Source → search SIWAKY_PDP */}
      <span
        suppressHydrationWarning
        aria-hidden
        dangerouslySetInnerHTML={{ __html: "<!-- SIWAKY_PDP_VERSION_3.0 -->" }}
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", clip: "rect(0,0,0,0)" }}
      />
      <ProductJsonLd locale={locale} />
      <ProductViewedTracker />
      <ProductDeployProbe />
      <div className="bg-[#28282A] pb-28 font-sans text-white md:pb-0" data-siwaky-pdp-version="3.0">
        <ProductHero />
        <ProductBenefits />
        <ProductSectionDivider />
        <Ingredients />
        <ProductSectionDivider />
        <HowToUse />
        <ProductSectionDivider />
        <ProductComparisonTable />
        <ProductSectionDivider />
        <ReviewsSection />
        <ProductSectionDivider />
        <FAQSection />
        <ProductSectionDivider />
        <ProductFinalCTA />
      </div>
    </>
  );
}
