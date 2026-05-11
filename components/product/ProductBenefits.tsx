"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface Item {
  icon: string;
  title: string;
  desc: string;
}

export default function ProductBenefits() {
  const t = useTranslations("product.benefits");
  const items = t.raw("items") as Item[];

  return (
    <section className="section-padding bg-brand-dark2">
      <div className="container-luxury">
        <div className="text-center">
          <span className="ornament text-xs uppercase tracking-[0.4em] text-brand-goldLight">
            Benefits
          </span>
          <h2 className="mt-4 font-display text-3xl text-white md:text-5xl">
            {t("title")}
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="card-luxury"
            >
              <div className="text-4xl">{it.icon}</div>
              <h3 className="mt-5 font-display text-2xl text-white">{it.title}</h3>
              <p className="mt-2 text-sm text-white/70">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
