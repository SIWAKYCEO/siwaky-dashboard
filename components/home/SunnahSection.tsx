"use client";

import { motion } from "framer-motion";
import { BookOpen, Leaf, Award } from "lucide-react";
import { useTranslations } from "next-intl";

const ITEMS = [
  { key: "sunnah",  Icon: BookOpen },
  { key: "natural", Icon: Leaf },
  { key: "halal",   Icon: Award },
] as const;

export default function SunnahSection() {
  const t = useTranslations("sunnah");

  return (
    <section className="section-padding relative overflow-hidden bg-brand-black">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #C9A84C 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="container-luxury relative text-center">
        <span className="ornament text-xs uppercase tracking-[0.4em] text-brand-goldLight">
          {t("kicker")}
        </span>

        <motion.blockquote
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="mx-auto mt-8 max-w-3xl"
        >
          <p className="font-display text-3xl leading-[1.5] text-white md:text-5xl md:leading-[1.45]">
            {t("hadith")}
          </p>
          <footer className="mt-6 font-serif text-base uppercase tracking-[0.3em] text-brand-goldLight">
            {t("narrator")}
          </footer>
        </motion.blockquote>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {ITEMS.map(({ key, Icon }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card-luxury text-start"
            >
              <Icon className="size-7 text-brand-gold" />
              <h3 className="mt-5 font-display text-2xl text-white">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-white/70">{t(`items.${key}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
