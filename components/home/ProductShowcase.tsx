"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { OFFERS } from "@/lib/offers";
import productPhoto from "@/lib/media/product-photo";

const ORDER: Array<keyof typeof OFFERS> = ["box-1", "box-2", "box-3"];

export default function ProductShowcase() {
  const t = useTranslations();
  const ttrust = useTranslations("trust");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  return (
    <section className="section-padding bg-brand-dark">
      <div className="container-luxury grid items-center gap-12 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="relative aspect-square overflow-hidden rounded-2xl border border-white/5 shadow-gold"
        >
          <Image
            src={productPhoto}
            alt={t("product.photoAlt")}
            fill
            sizes="(max-width: 768px) 100vw, 42vw"
            className="object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark/70 via-transparent to-transparent" />
          <span className="absolute top-4 start-4 badge-gold">{ttrust("halal")}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl text-white md:text-5xl">
            {t("product.title")}
          </h2>
          <p className="mt-2 text-sm text-white/70">{t("product.ratingLine", { count: 127 })}</p>

          <span className="my-6 block divider-gold !mx-0" />

          <p className="text-base leading-8 text-white/75">{t("flavors.sub")}</p>

          <ul className="mt-6 space-y-3">
            {ORDER.map((id) => {
              const offer = OFFERS[id];
              return (
                <li
                  key={id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-brand-dark2/50 px-4 py-3"
                >
                  <span className="text-white/90">
                    {t(`product.offers.${id}.title`)}
                    {offer.badge && (
                      <span className="ms-2 badge-gold">
                        {t(`product.offers.${id}.badge`)}
                      </span>
                    )}
                  </span>
                  <span className="font-serif text-lg text-brand-goldLight">
                    {offer.price} {t("common.currency")}
                  </span>
                </li>
              );
            })}
          </ul>

          <Link
            href={`/${locale}/product`}
            className="btn-primary mt-8 inline-flex"
          >
            {t("hero.cta")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
