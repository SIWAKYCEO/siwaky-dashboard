"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { FLAVOR_VISUALS } from "@/lib/flavors-visual";

export default function FlavorsSection() {
  const t = useTranslations("flavors");
  const locale = useLocale();

  return (
    <section className="section-padding bg-brand-dark">
      <div className="container-luxury">
        <div className="text-center">
          <span className="ornament text-xs uppercase tracking-[0.4em] text-brand-goldLight">
            {t("sectionKicker")}
          </span>
          <h2 className="mt-4 font-display text-3xl text-white md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-white/70">{t("sub")}</p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {FLAVOR_VISUALS.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="card-luxury overflow-hidden"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.tint} opacity-60`}
              />
              <div className="relative">
                <div className="flex h-28 items-center justify-center px-2">
                  <Image
                    src={f.img}
                    alt={t(`items.${f.key}.name`)}
                    width={296}
                    height={296}
                    className="relative z-[1] h-[7rem] w-[7rem] object-contain p-2 drop-shadow-[0_8px_24px_rgba(0,0,0,.4)] md:h-[7.25rem] md:w-[7.25rem]"
                  />
                </div>
                <h3 className="mt-4 font-display text-2xl text-white">
                  {t(`items.${f.key}.name`)}
                </h3>
                {locale !== "en" ? (
                  <p className="mt-1 font-serif text-sm uppercase tracking-[0.3em] text-brand-goldLight">
                    {t(`items.${f.key}.secondary`)}
                  </p>
                ) : null}
                <p className="mt-3 text-sm text-white/70">
                  {t(`items.${f.key}.desc`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
