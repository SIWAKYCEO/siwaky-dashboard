"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface FlavorCard {
  emoji: string;
  name: string;
  desc: string;
}

export default function ProductFlavorsShowcase() {
  const t = useTranslations("product.flavorsShowcase");
  const items = t.raw("items") as FlavorCard[];

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55 }}
      className="bg-brand-dark py-14 md:py-20"
    >
      <div className="container-luxury">
        <h2 className="text-center font-display text-3xl text-white md:text-[2.75rem]">{t("title")}</h2>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6">
          {items.map((item, i) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-brand-gold/25 bg-black px-6 py-8 transition-all duration-300 hover:border-brand-gold hover:shadow-[0_0_32px_-8px_rgba(201,168,76,0.55)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.08),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative text-center">
                <span className="text-5xl md:text-[3.25rem]" aria-hidden>
                  {item.emoji}
                </span>
                <h3 className="mt-4 font-display text-2xl text-white md:text-[1.85rem]">{item.name}</h3>
                <p className="mt-3 font-sans text-[0.9375rem] leading-relaxed text-white/75">{item.desc}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
