import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import ProductHero from "@/components/product/ProductHero";
import ProductBenefits from "@/components/product/ProductBenefits";
import Ingredients from "@/components/product/Ingredients";
import HowToUse from "@/components/product/HowToUse";
import ReviewsSection from "@/components/product/ReviewsSection";
import FAQSection from "@/components/product/FAQSection";
import HalalCertSection from "@/components/home/HalalCertSection";
import ProductViewedTracker from "@/components/product/ProductViewedTracker";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta.product" });
  return { title: t("title"), description: t("description") };
}

export default function ProductPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  return (
    <>
      <ProductViewedTracker />
      <ProductHero />
      <ProductBenefits />
      <Ingredients />
      <HowToUse />
      <HalalCertSection />
      <ReviewsSection />
      <FAQSection />
    </>
  );
}
