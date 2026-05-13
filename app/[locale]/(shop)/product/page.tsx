/**
 * Product PDP route (URL: /{locale}/product).
 * Implemented under the `(shop)` segment — there is no separate `app/[locale]/product/page.tsx`.
 */
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import ProductHero from "@/components/product/ProductHero";
import ProductBenefits from "@/components/product/ProductBenefits";
import ProductFlavorsShowcase from "@/components/product/ProductFlavorsShowcase";
import Ingredients from "@/components/product/Ingredients";
import HowToUse from "@/components/product/HowToUse";
import ProductComparisonTable from "@/components/product/ProductComparisonTable";
import ReviewsSection from "@/components/product/ReviewsSection";
import FAQSection from "@/components/product/FAQSection";
import ProductFinalCTA from "@/components/product/ProductFinalCTA";
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
      <ProductJsonLd locale={locale} />
      <ProductViewedTracker />
      <div dir="rtl" lang="ar" className="bg-brand-dark pb-28 font-sans text-white md:pb-0">
        <ProductHero />
        <ProductBenefits />
        <ProductSectionDivider />
        <ProductFlavorsShowcase />
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
