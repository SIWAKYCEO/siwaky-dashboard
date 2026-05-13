"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface Ingredient {
  icon: string;
  title: string;
  desc: string;
}

export default function Ingredients() {
  const t = useTranslations("product.ingredients");
  const items = t.raw("items") as Ingredient[];

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55 }}
      className="bg-brand-dark py-14 md:py-20"
    >
      <div className="container-luxury">
        <div className="text-center">
          <h2 className="font-display text-3xl text-white md:text-[2.75rem]">{t("title")}</h2>
          <p className="mx-auto mt-4 max-w-3xl font-sans text-base leading-8 text-white/72">{t("science")}</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {items.map((it, i) => (
            <motion.article
              key={it.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="rounded-2xl border border-brand-gold/45 bg-black px-6 py-6 md:px-7 md:py-7"
            >
              <div className="flex gap-4">
                <span className="text-4xl leading-none" aria-hidden>
                  {it.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-xl text-white md:text-[1.35rem]">{it.title}</h3>
                  <p className="mt-2 font-sans text-sm leading-7 text-white/72 md:text-[0.9375rem]">{it.desc}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
