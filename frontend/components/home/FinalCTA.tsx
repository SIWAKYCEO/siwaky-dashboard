"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import LuxuryMediaPlaceholder from "@/components/shared/LuxuryMediaPlaceholder";
import ScarcityBar from "@/components/shared/ScarcityBar";

export default function FinalCTA() {
  const t = useTranslations("finalCta");
  const thero = useTranslations("hero");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  return (
    <section className="section-padding relative overflow-hidden bg-[#28282A]">
      <div className="absolute inset-0">
        <LuxuryMediaPlaceholder variant="cta" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(40,40,42,0.9)_0%,rgba(26,26,28,0.94)_100%)]" aria-hidden />
      </div>
      <div className="container-luxury relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="font-display text-4xl text-white md:text-6xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-white/80">{t("sub")}</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <ScarcityBar label={(n) => thero("scarcityCount", { count: n })} />
            <Link href={`/${locale}/product`} className="btn-primary text-lg">
              {t("cta")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
