"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface QA {
  q: string;
  a: string;
}

export default function FAQSection() {
  const t = useTranslations("product.faq");
  const items = t.raw("items") as QA[];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55 }}
      className="bg-[#28282A] py-14 md:py-20"
    >
      <div className="container-luxury">
        <h2 className="text-center font-display text-3xl text-white md:text-[2.75rem]">{t("title")}</h2>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.22)] bg-[#28282A]"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
                  aria-expanded={isOpen}
                >
                  <span className="font-sans text-base font-medium text-white">{item.q}</span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-brand-gold transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    strokeWidth={2.25}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-white/[0.06] px-5 pb-5 pt-4 font-sans text-sm leading-8 text-white/75">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
