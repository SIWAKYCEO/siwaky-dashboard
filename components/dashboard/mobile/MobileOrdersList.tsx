"use client";

import { formatSar, lineRevenue, statusAccent } from "@/lib/dashboard/kpi";
import { scrollToDashboardSection } from "@/components/dashboard/shell/dashboardNav";
import type { OrderRow } from "@/lib/dashboard/types";

export function MobileOrdersList({ orders }: { orders: OrderRow[] }) {
  const latest = [...orders].reverse().slice(0, 5);

  return (
    <div className="md:hidden" dir="rtl">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-dashDisplay text-[16px] font-semibold text-white">أحدث الطلبات</h2>
        <button
          type="button"
          onClick={() => scrollToDashboardSection("live")}
          className="font-dashSans text-[12px] font-semibold text-[#c9a84c] transition-opacity hover:opacity-75"
        >
          عرض الكل
        </button>
      </div>

      {/* Cards */}
      {latest.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.06] bg-[#1e1e20] px-4 py-5 text-center text-[13px] text-white/40">
          لا يوجد طلبات بعد
        </p>
      ) : (
        <div className="space-y-2">
          {latest.map((order, i) => {
            const accent = statusAccent(order);
            const rev    = lineRevenue(order);
            const name   = (order.name  ?? "").trim() || "—";
            const city   = (order.city  ?? "").trim() || "—";

            return (
              <div
                key={`${order.order_id}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#1c1c1e] px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-dashSans text-[14px] font-semibold text-white/92">
                    {name}
                  </p>
                  <p className="mt-0.5 font-dashSans text-[11px] text-white/42">{city}</p>
                </div>

                <div className="shrink-0 text-end">
                  <p className="font-dashDisplay text-[14px] font-semibold tabular-nums text-[#c9a84c]">
                    {rev > 0 ? formatSar(rev) : "—"}
                  </p>
                  <span className={`mt-0.5 block font-dashSans text-[10px] font-semibold uppercase tracking-[0.14em] ${accent.textClass}`}>
                    {accent.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
