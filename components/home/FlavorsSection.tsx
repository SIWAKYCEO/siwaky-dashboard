"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const FLAVORS = [
  { key: "natural", img: "/images/flavors/natural.png",  tint: "from-emerald-700/30 to-emerald-900/10" },
  { key: "mint",    img: "/images/flavors/mint.png",     tint: "from-teal-700/30 to-teal-900/10" },
  { key: "clove",   img: "/images/flavors/clove.png",    tint: "from-amber-800/30 to-orange-900/10" },
  { key: "coconut", img: "/images/flavors/coconut.png",  tint: "from-stone-500/20 to-stone-800/10" },
] as const;

export default function FlavorsSection() {
  const t = useTranslations("flavors");

  return (
    <section className="section-padding bg-brand-dark2">
      <div className="container-luxury">
        <div className="text-center">
          <span className="ornament text-xs uppercase tracking-[0.4em] text-brand-goldLight">
            Flavors
          </span>
          <h2 className="mt-4 font-display text-3xl text-white md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-white/70">{t("sub")}</p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {FLAVORS.map((f, i) => (
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
                <div className="flex h-28 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.img}
                    alt=""
                    className="h-24 w-24 object-contain drop-shadow-lg"
                    draggable={false}
                  />
                </div>
                <h3 className="mt-4 font-display text-2xl text-white">
                  {t(`items.${f.key}.name`)}
                </h3>
                <p className="mt-1 font-serif text-sm uppercase tracking-[0.3em] text-brand-goldLight">
                  {t(`items.${f.key}.en`)}
                </p>
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
