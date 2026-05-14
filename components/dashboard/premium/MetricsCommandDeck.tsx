"use client";

import { useMemo, type ReactNode } from "react";

import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgePercent,
  BarChart4,
  Banknote,
  PackageCheck,
  Receipt,
  TrendingUp,
  Truck,
  Undo2,
} from "lucide-react";

import type { DashboardAnalytics } from "@/lib/dashboard/analytics";
import {
  formatSar,
  lineRevenue,
  sheetCellTruthy,
} from "@/lib/dashboard/kpi";
import type { OrderRow } from "@/lib/dashboard/types";

type Tile = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  accent: string;
  delay?: number;
};

export function MetricsCommandDeck({
  analytics: a,
  orders,
}: {
  analytics: DashboardAnalytics;
  orders: OrderRow[];
}) {
  const reduceMotion = useReducedMotion();
  const { kpis } = a;
  const returnPct = a.returnRatePct;

  const deliveredRevenue = useMemo(() => {
    let s = 0;
    for (const o of orders) {
      if (sheetCellTruthy(o.delivered)) s += lineRevenue(o);
    }
    return s;
  }, [orders]);

  const tiles: Tile[] = [
    {
      label: "Gross commerce",
      value: formatSar(kpis.totalRevenue),
      hint: `Σ qty × price across ${kpis.totalOrders.toLocaleString("en-US")} rows`,
      icon: Banknote,
      accent: "from-[#c9a962]/25 via-white/[0.04] to-transparent",
      delay: 0,
    },
    {
      label: "Order volume",
      value: kpis.totalOrders.toLocaleString("en-US"),
      hint: "Rows synced from worksheet",
      icon: BarChart4,
      accent: "from-emerald-400/[0.17] via-white/[0.03] to-transparent",
      delay: 0.04,
    },
    {
      label: "Avg. order value",
      value:
        kpis.totalOrders === 0 ? "—" : formatSar(a.avgOrderValue),
      hint: kpis.totalOrders === 0 ? "Need at least one order" : "Revenue divided by snapshot width",
      icon: TrendingUp,
      accent: "from-sky-400/[0.16] via-white/[0.03] to-transparent",
      delay: 0.08,
    },
    {
      label: "Delivery rate",
      value: a.deliveryRatePct == null ? "—" : `${a.deliveryRatePct}%`,
      hint: `${kpis.deliveredCount.toLocaleString("en-US")} delivered orders`,
      icon: Truck,
      accent: "from-teal-300/[0.15] via-white/[0.03] to-transparent",
      delay: 0.12,
    },
    {
      label: "Confirmation rate",
      value:
        a.confirmationRatePct == null ? "—" : `${a.confirmationRatePct}%`,
      hint: `Uses affirmative cells in your sheet “confirmation” column`,
      icon: BadgePercent,
      accent: "from-indigo-300/[0.14] via-white/[0.03] to-transparent",
      delay: 0.16,
    },
    {
      label: "Return pressure",
      value: returnPct == null ? "—" : `${returnPct}%`,
      hint: `${kpis.returnedCount.toLocaleString("en-US")} flagged returned`,
      icon: Undo2,
      accent: "from-rose-400/[0.15] via-white/[0.03] to-transparent",
      delay: 0.2,
    },
    {
      label: "Delivered throughput",
      value: kpis.deliveredCount.toLocaleString("en-US"),
      hint: "Absolute delivered volume",
      icon: PackageCheck,
      accent: "from-lime-200/[0.12] via-white/[0.03] to-transparent",
      delay: 0.24,
    },
    {
      label: "Delivered revenue",
      value: kpis.deliveredCount === 0 ? "—" : formatSar(deliveredRevenue),
      hint: `Sum of SAR from rows flagged delivered`,
      icon: Receipt,
      accent: "from-amber-300/[0.14] via-white/[0.03] to-transparent",
      delay: 0.28,
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((t, i) => {
        const Icon = t.icon;
        return (
        <motion.article
          key={t.label}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: t.delay ?? 0 }}
          className="group relative rounded-[1.25rem] border border-white/[0.068] bg-gradient-to-br p-[1px] shadow-glass backdrop-blur-xl motion-safe:hover:border-[#c9a962]/38"
          style={{
            backgroundImage:
              `linear-gradient(155deg, rgba(255,255,255,.08), transparent 62%), radial-gradient(${i % 3 === 0 ? "ellipse at 105% -10%" : "circle at -10% 120%"}, rgba(201,169,98,.12), transparent 55%)`,
          }}
        >
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-0 rounded-[1.23rem] bg-gradient-to-br opacity-95 ${t.accent}`}
          />
          <div className="relative flex flex-col rounded-[calc(1.25rem-1px)] bg-[#29292c]/80 p-[1.15rem] sm:p-5 lg:min-h-[152px]">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/52">
                  {t.label}
                </p>
                <div className="font-dashDisplay text-[1.72rem] font-semibold tracking-tight text-white sm:text-[clamp(1.45rem,2.4vw,1.85rem)]">
                  {t.value}
                </div>
              </div>
              <div className="flex size-[46px] shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/42 text-[#ebe2c9] shadow-inner motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.03]">
                <Icon className="size-5 opacity-95 stroke-[1.5]" aria-hidden />
              </div>
            </div>
            {t.hint ? (
              <p className="mt-6 text-[12px] leading-relaxed text-siwaky-muted motion-safe:transition-colors group-hover:text-white/72">
                {t.hint}
              </p>
            ) : null}
          </div>
        </motion.article>
        );
      })}
    </div>
  );
}
