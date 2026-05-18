"use client";

import { useCallback, useMemo, useState } from "react";

import { PackagePlus } from "lucide-react";

import { liveOrderKey } from "@/lib/dashboard/geo/orderCoordinates";
import { formatSar, lineRevenue, statusAccent } from "@/lib/dashboard/kpi";
import { stableOrderFingerprint } from "@/lib/dashboard/orderFingerprint";
import type { OrderRow } from "@/lib/dashboard/types";

import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { GlassPanel } from "./ui/GlassPanel";
import { SheetPanelColumnHeader } from "./ui/SheetPanelColumnHeader";
import { StatusBadge } from "./ui/StatusBadge";

export function OrderFeed({
  orders,
  embedded = false,
  highlightFingerprints,
}: {
  orders: OrderRow[];
  embedded?: boolean;
  /** Rows detected via polling diff — temporary highlight ring */
  highlightFingerprints?: Set<string>;
}) {
  const [selected, setSelected] = useState<OrderRow | null>(null);

  const keys = useMemo(() => orders.map((o, idx) => ({ order: o, key: liveOrderKey(o, idx) })), [orders]);

  const closeDrawer = useCallback(() => setSelected(null), []);

  const header = (
    <SheetPanelColumnHeader
      eyebrow="Recent Orders"
      title="Latest rows from your sheet"
      subtitle="Tap a row to open structured details in the side panel."
      showingCount={orders.length}
    />
  );

  const list = (
    <div className="relative pr-0.5">
      <div className="relative space-y-3 pb-2 before:absolute before:left-[41px] before:top-[10px] before:z-[0] before:h-[calc(100%-24px)] before:w-[1px] before:bg-gradient-to-b before:from-[#c9a962]/50 before:via-white/10 before:to-transparent md:before:left-[45px]">
        {keys.map(({ order, key }) => {
          const accent = statusAccent(order);
          const rev = lineRevenue(order);
          const fp = stableOrderFingerprint(order);
          const rowHighlight = highlightFingerprints?.has(fp) ?? false;
          const titleParts = [order.product?.trim(), quantityLabel(order.quantity)].filter(Boolean);
          const subtitleParts = [
            order.name?.trim(),
            [order.city?.trim(), order.country?.trim()].filter(Boolean).join(", "),
          ].filter(Boolean);

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(order)}
              className={`group relative z-[1] w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-white/[0.06] via-[#29292d]/92 to-transparent px-6 py-[18px] text-left shadow-glass outline-none backdrop-blur-2xl motion-safe:hover:border-[#c9a962]/26 motion-safe:hover:shadow-[0_24px_80px_-32px_rgba(0,0,0,.8)] motion-safe:focus-visible:border-[#c9a962]/45 motion-safe:focus-visible:ring-2 motion-safe:focus-visible:ring-[#c9a962]/22 ${
                rowHighlight
                  ? "border-[#c9a962]/48 ring-2 ring-emerald-400/45 shadow-[0_0_52px_-14px_rgba(201,169,98,.48)] motion-safe:animate-pulseSoft"
                  : "border-white/[0.07]"
              }`}
            >
              <span className="pointer-events-none absolute -right-[18%] top-[-50%] h-[260%] w-[48%] rotate-[18deg] bg-gradient-to-bl from-transparent via-transparent to-[#c9a962]/12 opacity-80 transition-opacity duration-[420ms] group-hover:to-[#c9a962]/18" />

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
                        <span
                          className={`truncate font-dashDisplay text-[16px] font-semibold leading-snug text-white md:text-[17px] ${accent.textClass}`}
                        >
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
                      <div>
                        <dt className="text-white/42">Phone</dt>{" "}
                        <dd className="inline translate-y-[0.05em] text-white/74">{order.phone.trim()}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-white/42">Fulfillment</dt>{" "}
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
            </button>
          );
        })}
      </div>
    </div>
  );

  if (orders.length === 0) {
    const emptyBody = (
      <div className="rounded-2xl border border-dashed border-white/[0.12] bg-black/28 px-8 py-12 text-center backdrop-blur-sm">
        <PackagePlus className="mx-auto size-11 text-[#ebe2c9]/76" aria-hidden strokeWidth={1.5} />
        <p className="mt-5 font-dashDisplay text-lg text-white">No recent orders yet</p>
        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-siwaky-muted">
          Pull down to refresh or check that{" "}
          <code className="text-white/80">NEXT_PUBLIC_API_BASE_URL</code> points at your orders API.
        </p>
      </div>
    );

    if (embedded) {
      return (
        <>
          {emptyBody}
        </>
      );
    }

    return (
      <>
        {header}
        <GlassPanel outerClassName="border-dashed border-white/[0.12]" className="px-9 py-12 text-center">
          <PackagePlus className="mx-auto size-11 text-[#ebe2c9]/76" aria-hidden strokeWidth={1.5} />
          <p className="mt-5 font-dashDisplay text-lg text-white">No recent orders yet</p>
          <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-siwaky-muted">
            Pull down to refresh or check that{" "}
            <code className="text-white/80">NEXT_PUBLIC_API_BASE_URL</code> points at your orders API.
          </p>
        </GlassPanel>
        <OrderDetailDrawer open={false} order={null} onClose={closeDrawer} />
      </>
    );
  }

  const column = (
    <div className="min-w-0">
      {!embedded ? header : null}
      {list}
    </div>
  );

  if (embedded) {
    return (
      <>
        {column}
        <OrderDetailDrawer open={selected != null} order={selected} onClose={closeDrawer} />
      </>
    );
  }

  return (
    <>
      <GlassPanel outerClassName="overflow-hidden shadow-glassLg">
        <div className="p-8 sm:p-9">{column}</div>
      </GlassPanel>

      <OrderDetailDrawer open={selected != null} order={selected} onClose={closeDrawer} />
    </>
  );
}

function tierLabel(raw: string): string {
  const base = raw.trim().toLowerCase();
  if (base.includes("deliver")) return "Delivered";
  if (base.includes("transit")) return "In transit";
  if (base.includes("return")) return "Returned";
  if (base.includes("process")) return "Processing";
  return "Other";
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
