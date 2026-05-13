"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ProductFinalCTA() {
  const t = useTranslations("product.finalCtaProduct");
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? "ar";

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55 }}
      className="border-y border-brand-gold/25 bg-[#28282A] py-16 md:py-24"
    >
      <div className="container-luxury text-center">
        <h2 className="font-display text-3xl text-white md:text-[2.85rem]">{t("headline")}</h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-lg leading-8 text-white/78">{t("sub")}</p>
        <Link
          href={`/${locale}/product#product-hero-top`}
          className="btn-primary mt-10 inline-flex min-w-[200px] justify-center text-base"
        >
          {t("cta")}
        </Link>
      </div>
    </motion.section>
  );
}
