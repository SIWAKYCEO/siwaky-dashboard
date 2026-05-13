"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function HowToUse() {
  const t = useTranslations("product.howTo");
  const steps = t.raw("steps") as string[];

  return (
    <section className="section-padding bg-[#28282A]">
      <div className="container-luxury">
        <div className="text-center">
          <h2 className="font-display text-3xl text-white md:text-5xl">{t("title")}</h2>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card-luxury text-center"
            >
              <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full border border-brand-gold/50 font-serif text-2xl text-brand-goldLight">
                {i + 1}
              </span>
              <p className="mt-4 text-base leading-7 text-white/80">{step}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
