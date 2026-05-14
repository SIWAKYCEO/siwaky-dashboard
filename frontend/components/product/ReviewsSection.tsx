"use client";

import { motion } from "framer-motion";
import { Star, BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";

interface Review {
  name: string;
  city: string;
  stars: number;
  date: string;
  text: string;
}

export default function ReviewsSection() {
  const t = useTranslations("product.reviews");
  const items = t.raw("items") as Review[];

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55 }}
      className="bg-[#28282A] py-14 md:py-20"
    >
      <div className="container-luxury">
        <div className="text-center">
          <h2 className="font-display text-3xl text-white md:text-[2.75rem]">{t("title")}</h2>
          <p className="mt-3 font-sans text-base text-brand-goldLight md:text-lg">{t("average")}</p>
        </div>

        {/* Mobile: horizontal snap carousel */}
        <div className="mt-10 flex gap-4 overflow-x-auto overscroll-x-contain pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden snap-x snap-mandatory px-1">
          {items.map((r, i) => (
            <ReviewCard key={`${r.name}-m-${i}`} review={r} verified={t("verified")} className="w-[min(88vw,380px)] shrink-0 snap-center" />
          ))}
        </div>

        {/* Desktop: 3-column grid */}
        <div className="mt-10 hidden gap-6 md:grid md:grid-cols-3">
          {items.map((r, i) => (
            <ReviewCard key={`${r.name}-d-${i}`} review={r} verified={t("verified")} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function ReviewCard({
  review: r,
  verified,
  className = "",
}: {
  review: Review;
  verified: string;
  className?: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.4 }}
      className={`relative rounded-2xl border border-[rgba(201,168,76,0.22)] bg-[#28282A] px-5 py-5 shadow-[inset_0_1px_0_rgba(201,168,76,0.05)] md:px-6 md:py-6 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-1 text-brand-gold">
          {Array.from({ length: r.stars }).map((_, k) => (
            <Star key={k} className="size-4 fill-brand-gold" />
          ))}
          {Array.from({ length: 5 - r.stars }).map((_, k) => (
            <Star key={`e-${k}`} className="size-4 text-white/18" />
          ))}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-brand-gold/35 bg-brand-gold/[0.07] px-2 py-0.5 font-sans text-[11px] text-brand-goldLight">
          <BadgeCheck className="size-3.5 shrink-0 text-brand-gold" strokeWidth={2} />
          {verified}
        </span>
      </div>

      <p className="mt-4 font-sans text-[0.9375rem] leading-8 text-white/88">«{r.text}»</p>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-2 font-sans text-sm">
        <p className="text-brand-goldLight">
          — {r.name}، {r.city}
        </p>
        <time className="text-white/45" dateTime={r.date}>
          {r.date}
        </time>
      </div>
    </motion.article>
  );
}
