"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { RankedProduct } from "@/lib/dashboard/analytics";
import { formatSar } from "@/lib/dashboard/kpi";

export function ProductsLeaderboard({ products }: { products: RankedProduct[] }) {
  const reduceMotion = useReducedMotion();
  const max = Math.max(...products.map((p) => p.revenue), 1);

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 px-8 py-12 text-center text-[13px] text-white/50">
        No product labels detected in snapshot.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {products.map((p, i) => (
        <motion.article
          key={`${encodeURIComponent(p.product)}::${p.count}::${i}`}
          layout
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.035, duration: 0.32 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3.5 backdrop-blur-md motion-safe:hover:border-[#c9a962]/35"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-2 left-1 w-1 rounded-full bg-gradient-to-b from-[#c9a962]/95 via-emerald-300/65 to-transparent opacity-95"
          />
          <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/35 font-dashSans text-xs font-semibold uppercase tracking-[0.15em] text-white/62">
                  #{i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-dashDisplay text-[15px] font-semibold text-white">
                    {p.product}
                  </p>
                  <p className="mt-0.5 text-[12px] text-siwaky-muted">
                    {p.count} orders ·{" "}
                    <span className="tabular-nums">{p.pctOrders}% orders</span> ·{" "}
                    <span className="tabular-nums">{p.pctRevenue}% revenue mix</span>
                  </p>
                </div>
              </div>
              <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#c9a962]/90 via-emerald-300/70 to-sky-300/65"
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: `${Math.max(10, Math.round((p.revenue / max) * 100))}%` }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
            <span className="shrink-0 rounded-xl border border-white/[0.08] bg-black/35 px-3 py-2 font-dashSans text-sm font-semibold tabular-nums text-[#f4eed9] backdrop-blur">
              {formatSar(p.revenue)}
            </span>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
