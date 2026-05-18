"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { OFFERS } from "@/lib/offers";

const ORDER: Array<keyof typeof OFFERS> = ["box-1", "box-2", "box-3"];

export default function ProductShowcase() {
  const t = useTranslations();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  return (
    <section className="section-padding bg-brand-dark">
      <div className="container-luxury mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
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
