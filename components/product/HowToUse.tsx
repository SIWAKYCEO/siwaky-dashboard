"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function HowToUse() {
  const t = useTranslations("product.howTo");
  const steps = t.raw("steps") as string[];

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55 }}
      className="bg-[#28282A] py-14 md:py-20"
    >
      <div className="container-luxury">
        <h2 className="text-center font-display text-3xl text-white md:text-[2.75rem]">{t("title")}</h2>

        <ol className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="flex flex-col items-center rounded-2xl border border-[rgba(201,168,76,0.22)] bg-[#28282A] px-5 pb-6 pt-8 text-center shadow-[inset_0_1px_0_rgba(201,168,76,0.05)]"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-brand-gold bg-[#28282A] font-display text-xl font-bold text-brand-goldLight shadow-[0_0_20px_-6px_rgba(201,168,76,0.65)]">
                {i + 1}
              </span>
              <p className="mt-5 font-sans text-[0.9375rem] leading-7 text-white/82">{step}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </motion.section>
  );
}
