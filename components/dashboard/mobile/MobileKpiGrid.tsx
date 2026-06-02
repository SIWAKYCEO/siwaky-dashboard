"use client";

import { useMemo } from "react";

import { lineRevenue } from "@/lib/dashboard/kpi";
import type { OrderRow } from "@/lib/dashboard/types";

// ── Date parsing ─────────────────────────────────────────────────────────────

function parseOrderDate(raw: string): Date | null {
  const s = (raw ?? "").trim();
  if (!s) return null;

  // DD/MM/YYYY  DD-MM-YYYY  DD.MM.YYYY
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m) {
    const d = +m[1], mo = +m[2], y = +m[3];
    const fullY = y < 100 ? 2000 + y : y;
    const dt = new Date(fullY, mo - 1, d);
    if (!isNaN(dt.getTime())) return dt;
  }

  // ISO or native
  const native = new Date(s);
  return isNaN(native.getTime()) ? null : native;
}

type PeriodStats = { revenue: number; orders: number };

function computePeriods(orders: OrderRow[]): {
  today: PeriodStats;
  yesterday: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
} {
  const now   = new Date();
  const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterStart  = new Date(todayStart); yesterStart.setDate(todayStart.getDate() - 1);
  const weekStart    = new Date(todayStart); weekStart.setDate(todayStart.getDate() - 6);
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1);

  const mk = (): PeriodStats => ({ revenue: 0, orders: 0 });
  const s = { today: mk(), yesterday: mk(), week: mk(), month: mk() };

  for (const o of orders) {
    const d = parseOrderDate(o.date);
    if (!d) continue;
    const rev = lineRevenue(o);

    if (d >= todayStart)                         { s.today.orders++;     s.today.revenue     += rev; }
    if (d >= yesterStart && d < todayStart)      { s.yesterday.orders++; s.yesterday.revenue += rev; }
    if (d >= weekStart)                          { s.week.orders++;      s.week.revenue      += rev; }
    if (d >= monthStart)                         { s.month.orders++;     s.month.revenue     += rev; }
  }

  return s;
}

function fmtSar(n: number): string {
  return n === 0 ? "—" : n.toLocaleString("ar-SA", { maximumFractionDigits: 0 });
}

// ── Card config ───────────────────────────────────────────────────────────────

const CARDS = [
  { key: "today",     label: "اليوم",   bg: "#0c1221", border: "rgba(59,130,246,0.18)",  accent: "#60a5fa" },
  { key: "yesterday", label: "أمس",    bg: "#0c1a1a", border: "rgba(20,184,166,0.18)",  accent: "#2dd4bf" },
  { key: "week",      label: "الأسبوع", bg: "#161008", border: "rgba(201,168,76,0.22)",  accent: "#c9a84c" },
  { key: "month",     label: "الشهر",   bg: "#180c0c", border: "rgba(244,63,94,0.18)",   accent: "#fb7185" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function MobileKpiGrid({ orders }: { orders: OrderRow[] }) {
  const periods = useMemo(() => computePeriods(orders), [orders]);

  return (
    <div className="grid grid-cols-2 gap-3 md:hidden" dir="rtl">
      {CARDS.map((card) => {
        const stat = periods[card.key];
        return (
          <div
            key={card.key}
            style={{ background: card.bg, borderColor: card.border }}
            className="rounded-2xl border p-4"
          >
            <p
              style={{ color: card.accent }}
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
            >
              {card.label}
            </p>

            <p className="mt-2 font-dashDisplay text-[1.55rem] font-semibold leading-none tabular-nums text-white">
              {fmtSar(stat.revenue)}
              <span className="ms-1.5 text-[11px] font-normal text-white/45">ر.س</span>
            </p>

            <p className="mt-1.5 text-[12px] text-white/50">
              {stat.orders === 0 ? "لا يوجد" : `${stat.orders} طلب`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
