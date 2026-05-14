"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

interface Item {
  name: string;
  city: string;
  text: string;
}

export default function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const items = t.raw("items") as Item[];

  return (
    <section className="section-padding bg-brand-dark2">
      <div className="container-luxury">
        <div className="text-center">
          <span className="ornament text-xs uppercase tracking-[0.4em] text-brand-goldLight">
            Reviews
          </span>
          <h2 className="mt-4 font-display text-3xl text-white md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-white/70">{t("sub")}</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="card-luxury"
            >
              <div className="flex items-center gap-1 text-brand-gold">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="size-4 fill-brand-gold" />
                ))}
              </div>
              <p className="mt-4 text-base leading-8 text-white/85">«{item.text}»</p>
              <p className="mt-5 text-sm text-brand-goldLight">
                — {item.name}، {item.city}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
