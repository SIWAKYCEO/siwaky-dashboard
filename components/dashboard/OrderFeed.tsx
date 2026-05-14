"use client";

import { PackagePlus } from "lucide-react";

import { formatSar, lineRevenue, statusAccent } from "@/lib/dashboard/kpi";
import type { OrderRow } from "@/lib/dashboard/types";

import { GlassPanel } from "./ui/GlassPanel";
import { StatusBadge } from "./ui/StatusBadge";

export function OrderFeed({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <GlassPanel outerClassName="border-dashed border-white/[0.12]" className="px-9 py-12 text-center">
        <PackagePlus className="mx-auto size-11 text-[#ebe2c9]/76" aria-hidden strokeWidth={1.5} />
        <p className="mt-5 font-dashDisplay text-lg text-white">
          Ledger cleared
        </p>
        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-siwaky-muted">
          Pull-to-sync or ping FastAPI · confirm{" "}
          <code className="text-white/80">NEXT_PUBLIC_API_BASE_URL</code> mirrors your sheet bridge.
        </p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel outerClassName="overflow-hidden shadow-glassLg">
      <div className="p-8 sm:p-9">
        <div className="mb-11 flex flex-wrap items-start justify-between gap-6 px-0.5">
          <div>
            <div className="flex items-start gap-3">
              <div className="mt-2 flex size-[11px] flex-none rounded-full bg-gradient-to-br from-emerald-200 via-[#c9a962] to-sky-300 shadow-[0_0_20px_-2px_rgba(167,243,208,.72)] motion-safe:animate-pulseSoft" />
              <div>
                <p className="font-dashSans text-[11px] font-semibold uppercase tracking-[0.32em] text-siwaky-muted">
                  Order desk
                </p>
                <p className="mt-3 font-dashDisplay text-lg font-semibold text-white md:text-xl">
                  Inbox · latest sheet slice
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-[12px] leading-relaxed text-siwaky-muted">
              Ultra-recent confirmations with routing metadata for concierge follow-up queues.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-3 rounded-[1rem] border border-white/[0.08] bg-black/52 px-[18px] py-2 shadow-inner backdrop-blur-md tabular-nums">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/62">
              Viewing {orders.length}
            </span>
            <span className="rounded-lg border border-emerald-400/[0.2] bg-emerald-500/[0.12] px-2 py-[2px] font-dashSans text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/95">
              Live ledger
            </span>
          </span>
        </div>

        <div className="relative space-y-3 before:absolute before:left-[41px] before:top-[10px] before:z-[0] before:h-[calc(100%-24px)] before:w-[1px] before:bg-gradient-to-b before:from-[#c9a962]/50 before:via-white/10 before:to-transparent md:before:left-[45px]">
          {orders.map((order, idx) => {
            const accent = statusAccent(order);
            const rev = lineRevenue(order);
            const titleParts = [
              order.product?.trim(),
              quantityLabel(order.qty),
            ].filter(Boolean);
            const subtitleParts = [
              order.name?.trim(),
              [order.city?.trim(), order.country?.trim()].filter(Boolean).join(", "),
            ].filter(Boolean);
            const keySeed = `${order.phone}-${idx}-${subtitleParts.join("-")}-${titleParts.join("-")}`;
            const keyPrefix = sanitizeKey(keySeed);

            return (
              <article
                key={keyPrefix.slice(0, 120)}
                className="group relative z-[1] overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] via-[#29292d]/92 to-transparent px-6 py-[18px] shadow-glass motion-safe:hover:border-[#c9a962]/26 motion-safe:hover:shadow-[0_24px_80px_-32px_rgba(0,0,0,.8)] backdrop-blur-2xl"
              >
                <div className="pointer-events-none absolute -right-[18%] top-[-50%] h-[260%] w-[48%] rotate-[18deg] bg-gradient-to-bl from-transparent via-transparent to-[#c9a962]/12 opacity-80 transition-opacity duration-[420ms] group-hover:to-[#c9a962]/18" />

                <div className="relative flex gap-5 md:gap-6">
                  <span
                    aria-hidden
                    className={`mt-2 hidden h-[11px] w-[11px] flex-none shrink-0 rounded-full ring-[6px] ring-[#28282a] sm:block ${accent.dotClass} ${accent.ringClass}`}
                  />
                  <span
                    aria-hidden
                    className={`mt-[6px] h-[11px] w-[11px] flex-none shrink-0 rounded-full ring-[6px] ring-[#28282a] sm:hidden ${accent.dotClass} ${accent.ringClass}`}
                  />

                  <div className="min-w-0 flex-1 space-y-3 md:pb-px">
                    <div className="flex flex-wrap items-start justify-between gap-4 md:gap-6">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-[10px] gap-y-[6px]">
                          <span className={`truncate font-dashDisplay text-[16px] font-semibold leading-snug text-white md:text-[17px] ${accent.textClass}`}>
                            {titleParts.length ? titleParts.join(" · ") : "Order"}
                          </span>
                          <StatusBadge accent={accent} />
                        </div>
                        {subtitleParts.length ? (
                          <p className="truncate text-[13px] text-white/[0.61]">{subtitleParts.join(" · ")}</p>
                        ) : null}
                      </div>
                      <span className="rounded-[1rem] border border-white/[0.12] bg-black/[0.53] px-4 py-2 text-right align-top font-dashSans text-sm font-semibold tabular-nums text-[#f4eed9] shadow-inner backdrop-blur-md">
                        {formatSar(rev)}
                      </span>
                    </div>

                    <dl className="flex flex-wrap gap-x-7 gap-y-2 border-t border-white/[0.05] pt-4 text-[12px] text-white/[0.5] md:gap-x-11">
                      {order.phone?.trim() ? (
                        <>
                          <div>
                            <dt className="text-white/42">Tel</dt>{" "}
                            <dd className="inline translate-y-[0.05em] text-white/74">{order.phone.trim()}</dd>
                          </div>
                        </>
                      ) : null}
                      <div>
                        <dt className="text-white/42">Fulfillment tier</dt>{" "}
                        <dd className="inline capitalize text-white/78">{tierLabel(accent.label)}</dd>
                      </div>
                      {sheetPreview(order.cod_fee, "") ? (
                        <div>
                          <dt className="text-white/42">COD</dt>{" "}
                          <dd className="inline text-white/[0.71]">{sheetPreview(order.cod_fee, "—")}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}

function tierLabel(raw: string): string {
  const base = raw.trim().toLowerCase();
  if (base.includes("deliver")) return "premium route";
  if (base.includes("transit")) return "transit runway";
  if (base.includes("return")) return "reverse logistics";
  if (base.includes("process")) return "staging";
  return "signal";
}

function quantityLabel(raw: string | undefined): string {
  const n = Number.parseFloat(String(raw ?? "").replace(/[^\d.-]/g, ""));
  const qty = Number.isFinite(n) && n !== 0 ? String(n).replace(/\.0+$/, "") : (raw ?? "").trim();
  if (!qty) return "";
  return `× ${qty}`;
}

function sheetPreview(value: string | undefined, fallback: string): string {
  const v = (value ?? "").trim();
  if (!v || v === "-" || v === "—") return fallback;
  return v;
}

function sanitizeKey(seed: string): string {
  return seed.replace(/\s+/g, " ").slice(0, 200);
}
