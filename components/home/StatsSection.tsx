"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

const STATS: { key: string; value: number; suffix: string; decimals?: number }[] = [
  { key: "ordersDelivered", value: 5000, suffix: "+" },
  { key: "rating",          value: 4.9,  suffix: "★", decimals: 1 },
  { key: "natural",         value: 100,  suffix: "%" },
  { key: "flavors",         value: 4,    suffix: "" },
];

function Counter({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, to, { duration: 1.6, ease: "easeOut" });
      return controls.stop;
    }
  }, [inView, mv, to]);

  return (
    <motion.span ref={ref}>
      <motion.span>{rounded}</motion.span>
    </motion.span>
  );
}

export default function StatsSection() {
  const t = useTranslations("stats");
  return (
    <motion.section
      className="border-y border-white/5 bg-brand-dark2 py-14"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="container-luxury grid grid-cols-2 gap-8 text-center md:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
          >
            <p className="font-display text-4xl text-brand-goldLight md:text-5xl">
              <Counter to={s.value} decimals={s.decimals ?? 0} />
              <span className="ms-1">{s.suffix}</span>
            </p>
            <p className="mt-2 text-sm text-white/70">{t(s.key)}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
