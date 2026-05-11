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
    <section className="section-padding bg-brand-black">
      <div className="container-luxury">
        <div className="text-center">
          <h2 className="font-display text-3xl text-white md:text-5xl">{t("title")}</h2>
          <p className="mt-4 mx-auto max-w-2xl text-white/70">{t("science")}</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="card-luxury flex items-start gap-4"
            >
              <div className="text-4xl">{it.icon}</div>
              <div>
                <h3 className="font-display text-2xl text-white">{it.title}</h3>
                <p className="mt-2 text-sm text-white/70">{it.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
