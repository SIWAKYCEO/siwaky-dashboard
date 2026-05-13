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
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55 }}
      className="bg-[#28282A] py-14 md:py-20"
    >
      <div className="container-luxury">
        <h2 className="text-center font-display text-3xl text-white md:text-[2.75rem]">{t("title")}</h2>

        <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 md:gap-y-5">
          {items.map((it, i) => (
            <motion.li
              key={`${it.title}-${i}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex items-start gap-3"
            >
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-gold/45 bg-[#28282A] text-xl shadow-[inset_0_0_0_1px_rgba(201,168,76,0.12)]"
                aria-hidden
              >
                {it.icon}
              </span>
              <p className="min-w-0 font-sans text-[0.9375rem] leading-relaxed text-white/82 md:text-[0.96875rem]">
                <span className="font-semibold text-white">{it.title}</span>
                <span className="text-brand-gold/55"> · </span>
                <span>{it.desc}</span>
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}
