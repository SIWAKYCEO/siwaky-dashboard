"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";

import productPhoto from "@/lib/media/product-photo";

export default function BrandStory() {
  const t = useTranslations("story");
  const tRoot = useTranslations();

  return (
    <section className="section-padding bg-brand-dark">
      <div className="container-luxury grid items-center gap-12 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="order-1"
        >
          <span className="text-xs uppercase tracking-[0.4em] text-brand-goldLight">
            {t("kicker")}
          </span>
          <h2 className="mt-4 font-display text-3xl leading-tight text-white md:text-5xl">
            {t("title")}
          </h2>
          <span className="my-6 block divider-gold !mx-0" />
          <p className="max-w-xl text-lg leading-9 text-white/75">{t("body")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="order-2"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/5 shadow-gold">
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={productPhoto}
                alt={tRoot("product.photoAlt")}
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover object-center"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark/75 via-transparent to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
