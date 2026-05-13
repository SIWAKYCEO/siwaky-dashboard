"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import ScarcityBar from "@/components/shared/ScarcityBar";
import { IMAGE_ALT_AR } from "@/lib/seo/image-alts-ar";

export default function FinalCTA() {
  const t = useTranslations("finalCta");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  return (
    <section className="section-padding relative overflow-hidden bg-brand-black">
      <div className="absolute inset-0 opacity-30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cta.jpg"
          alt={IMAGE_ALT_AR.ctaBg}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
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
            <ScarcityBar />
            <Link href={`/${locale}/product`} className="btn-primary text-lg">
              {t("cta")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
