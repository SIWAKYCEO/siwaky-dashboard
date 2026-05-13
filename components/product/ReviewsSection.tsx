"use client";

import { motion } from "framer-motion";
import { Star, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

interface Review {
  name: string;
  city: string;
  stars: number;
  text: string;
}

const FILTERS = [5, 4, 3, 0] as const; // 0 = all

export default function ReviewsSection() {
  const t = useTranslations("product.reviews");
  const items = t.raw("items") as Review[];
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(0);

  const visible = useMemo(
    () => (filter === 0 ? items : items.filter((r) => r.stars === filter)),
    [filter, items],
  );

  return (
    <section className="section-padding bg-[#28282A]">
      <div className="container-luxury">
        <div className="text-center">
          <h2 className="font-display text-3xl text-white md:text-5xl">{t("title")}</h2>
          <p className="mt-3 text-white/70">{t("average")}</p>
        </div>

        <div className="mx-auto mt-8 flex max-w-md flex-wrap justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                filter === f
                  ? "border-brand-gold bg-brand-gold/10 text-brand-goldLight"
                  : "border-white/10 text-white/70 hover:border-brand-gold/50"
              }`}
            >
              {f === 0 ? "الكل" : `${f} نجوم`}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {visible.map((r, i) => (
            <motion.div
              key={`${r.name}-${i}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: (i % 2) * 0.08 }}
              className="card-luxury"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-brand-gold">
                  {Array.from({ length: r.stars }).map((_, k) => (
                    <Star key={k} className="size-4 fill-brand-gold" />
                  ))}
                  {Array.from({ length: 5 - r.stars }).map((_, k) => (
                    <Star key={`e-${k}`} className="size-4 text-white/20" />
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                  <CheckCircle2 className="size-3.5" /> {t("verified")}
                </span>
              </div>

              <p className="mt-4 text-base leading-8 text-white/85">«{r.text}»</p>
              <p className="mt-5 text-sm text-brand-goldLight">
                — {r.name}، {r.city}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
