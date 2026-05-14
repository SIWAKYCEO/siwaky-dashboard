"use client";

import type { ReactNode } from "react";
import { Truck, ShieldCheck } from "lucide-react";

function RingGauge({
  value,
  label,
  icon,
  caption,
  iconWrapClass = "text-[#ebe2c9]",
}: {
  value: number | null;
  label: string;
  icon: ReactNode;
  caption: string;
  iconWrapClass?: string;
}) {
  const pct = value == null ? null : Math.min(100, Math.max(0, value));

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] via-[#28282a] to-[#1f2023] p-5 shadow-glass backdrop-blur-xl md:flex-row md:items-center md:gap-8">
      <div className="flex items-center gap-3 md:w-[220px] md:flex-col md:items-start md:gap-2">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/35 shadow-inner ${iconWrapClass}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/42">{label}</p>
          <p className="mt-2 text-[13px] leading-snug text-siwaky-muted">{caption}</p>
        </div>
      </div>
      <div className="relative mx-auto grid size-[136px] place-items-center md:mx-0">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full opacity-55 blur-xl motion-safe:animate-dashGlow"
          style={{
            background:
              pct == null ? "transparent" : "radial-gradient(circle at 40% 30%, rgba(201,169,98,0.45), transparent 55%)",
          }}
        />
        <div aria-hidden className="absolute inset-3 rounded-full border border-white/10 bg-[#28282a] shadow-inner" />
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={
            pct == null
              ? {
                  background:
                    "conic-gradient(from -90deg, rgba(255,255,255,0.08) 0deg, rgba(255,255,255,0.08) 360deg)",
                }
              : {
                  background: `conic-gradient(from -90deg, #c9a962 ${(pct / 100) * 360}deg, rgba(255,255,255,0.06) ${(pct / 100) * 360}deg)`,
                }
          }
        />
        <div className="absolute inset-[15px] rounded-full border border-white/[0.07] bg-[#28282a]/96" />
        <span className="relative font-dashSans text-3xl font-bold tabular-nums tracking-tighter text-white">
          {pct == null ? "—" : `${pct}%`}
        </span>
      </div>
    </div>
  );
}

export function FulfillmentGauges({
  deliveryRatePct,
  confirmationRatePct,
}: {
  deliveryRatePct: number | null;
  confirmationRatePct: number | null;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RingGauge
        iconWrapClass="text-emerald-300/95"
        icon={<Truck className="size-5 stroke-[1.5]" />}
        value={deliveryRatePct}
        label="Delivered orders"
        caption={`Percent of rows marked delivered in your sheet.`}
      />
      <RingGauge
        iconWrapClass="text-sky-200/95"
        icon={<ShieldCheck className="size-5 stroke-[1.5]" />}
        value={confirmationRatePct}
        label="Confirmed orders"
        caption={`Percent of rows marked confirmed in your sheet.`}
      />
    </div>
  );
}
