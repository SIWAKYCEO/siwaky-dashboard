"use client";

import { formatUsd, lineRevenue } from "@/lib/dashboard/kpi";
import type { OrderRow } from "@/lib/dashboard/types";

function fmtDate(raw: string | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})/);
  if (m) return `${m[1]}/${m[2]}`;
  return s.slice(0, 5);
}

export function MobileOrdersList({ orders }: { orders: OrderRow[] }) {
  const latest = [...orders].reverse().slice(0, 5);

  return (
    <div className="md:hidden" dir="rtl">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-dashDisplay text-[16px] font-semibold text-white">أحدث الطلبات</h2>
      </div>

      {/* Cards */}
      {latest.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.06] bg-[#1e1e20] px-4 py-5 text-center text-[13px] text-white/40">
          لا يوجد طلبات بعد
        </p>
      ) : (
        <div className="space-y-2">
          {latest.map((order, i) => {
            const rev  = lineRevenue(order);
            const name = (order.name ?? "").trim() || "—";
            const city = (order.city ?? "").trim() || "—";
            const date = fmtDate(order.date);

            return (
              <div
                key={`${order.order_id}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#1c1c1e] px-4 py-3.5"
              >
                {/* Right side: price + date */}
                <div className="shrink-0 text-left ltr">
                  <p className="font-dashDisplay text-[14px] font-semibold tabular-nums text-[#c9a84c]">
                    {rev > 0 ? formatUsd(rev) : "—"}
                  </p>
                  {date && (
                    <p className="mt-0.5 font-dashSans text-[11px] text-white/40">{date}</p>
                  )}
                </div>

                {/* Left side (renders on visual right due to RTL): name + city */}
                <div className="min-w-0 flex-1 text-right">
                  <p className="truncate font-dashSans text-[14px] font-bold text-white">
                    {name}
                  </p>
                  <p className="mt-0.5 font-dashSans text-[11px] text-white/45">{city}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
