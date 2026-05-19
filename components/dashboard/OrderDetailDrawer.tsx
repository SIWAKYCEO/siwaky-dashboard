"use client";

import { useEffect, type ReactNode } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { formatSar, lineRevenue, statusAccent } from "@/lib/dashboard/kpi";
import type { OrderRow } from "@/lib/dashboard/types";

import { StatusBadge } from "./ui/StatusBadge";

function rowLabel(raw: string | undefined): string {
  const v = (raw ?? "").trim();
  return v.length ? v : "—";
}

export function OrderDetailDrawer({
  open,
  order,
  onClose,
}: {
  open: boolean;
  order: OrderRow | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const accent = order ? statusAccent(order) : null;
  const revenue = order ? lineRevenue(order) : 0;

  return (
    <AnimatePresence>
      {open && order ? (
        <>
          <motion.button
            type="button"
            aria-label="Close order details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[2000] bg-[#0c0c0e]/72 backdrop-blur-[10px]"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-drawer-title"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-[2001] flex w-full max-w-[min(100vw,440px)] flex-col border-l border-[#c9a962]/14 bg-[#141416] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,-28px_0_80px_-24px_rgba(0,0,0,0.65)]"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {/* Premium header — sticky, no overlap */}
            <header className="relative shrink-0 border-b border-white/[0.06] bg-gradient-to-b from-[#1e1e21] to-[#171719] px-5 pb-4 pt-5 sm:px-6">
              <div className="flex gap-4">
                <div className="min-w-0 flex-1 pr-12">
                  <p className="font-dashSans text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c9a962]/85">
                    Order detail
                  </p>
                  <h2
                    id="order-drawer-title"
                    className="mt-2 font-dashDisplay text-[1.125rem] font-semibold leading-snug tracking-tight text-white sm:text-[1.25rem]"
                  >
                    <span className="line-clamp-2">{rowLabel(order.product)}</span>
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {accent ? <StatusBadge accent={accent} /> : null}
                    <span className="inline-flex items-center rounded-full border border-white/[0.1] bg-black/40 px-3 py-1 font-dashSans text-xs font-semibold tabular-nums text-[#f0e8d4]">
                      {formatSar(revenue)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-5 flex size-10 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.06] text-[#ebe2c9] shadow-[0_8px_28px_-12px_rgba(0,0,0,0.75)] backdrop-blur-md transition-colors hover:border-[#c9a962]/40 hover:bg-[#c9a962]/12 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a962]/50 sm:right-5 sm:top-6 sm:size-11"
                  aria-label="Close"
                >
                  <X className="size-[18px]" strokeWidth={1.75} aria-hidden />
                </button>
              </div>
            </header>

            {/* Single scroll surface */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
              <div className="px-5 py-6 sm:px-6">
                <div className="space-y-6">
                  <DetailSection title="Identity">
                    <FieldRow label="Order ID" value={rowLabel(order.order_id)} mono />
                    <FieldRow label="Date" value={rowLabel(order.date)} />
                    <FieldRow label="Time" value={rowLabel(order.time)} />
                  </DetailSection>

                  <DetailSection title="Customer & location">
                    <FieldRow label="Customer" value={rowLabel(order.name)} />
                    <FieldRow label="Phone" value={rowLabel(order.phone)} mono />
                    <FieldRow label="City" value={rowLabel(order.city)} />
                    <FieldRow label="Country" value={rowLabel(order.country)} />
                  </DetailSection>

                  <DetailSection title="Line & pricing">
                    <FieldRow label="Quantity" value={rowLabel(order.quantity)} />
                    <FieldRow label="Unit price" value={`${rowLabel(order.price_sar)} SAR`} mono />
                    <FieldRow label="COD fee" value={rowLabel(order.cod_fee)} mono />
                  </DetailSection>

                  <DetailSection title="Fulfillment">
                    <FieldRow label="Status" value={rowLabel(order.status)} />
                    <FieldRow label="Confirmed" value={rowLabel(order.confirmed)} />
                    <FieldRow label="Delivered" value={rowLabel(order.delivered)} />
                    <FieldRow label="Returned" value={rowLabel(order.returned)} />
                  </DetailSection>

                  <DetailSection title="Technical" subtle>
                    <FieldRow label="IP address" value={rowLabel(order.ip_address)} mono />
                    <FieldRow label="Device" value={rowLabel(order.device)} />
                  </DetailSection>

                  <DetailSection title="Attribution" subtle>
                    <FieldRow label="Source" value={rowLabel(order.source)} />
                    <FieldRow label="Campaign" value={rowLabel(order.campaign)} />
                    <FieldRow label="Notes" value={rowLabel(order.notes)} />
                  </DetailSection>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function DetailSection({
  title,
  children,
  subtle,
}: {
  title: string;
  children: ReactNode;
  subtle?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/[0.07] bg-black/32 ${
        subtle ? "opacity-95" : ""
      }`}
    >
      <div className="border-b border-white/[0.06] bg-white/[0.03] px-4 py-3 sm:px-5">
        <h3 className="font-dashSans text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
          {title}
        </h3>
      </div>
      <dl className="divide-y divide-white/[0.05] px-4 sm:px-5">{children}</dl>
    </section>
  );
}

function FieldRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 py-3.5 sm:grid-cols-[minmax(0,38%)_1fr] sm:items-start sm:gap-6">
      <dt className="font-dashSans text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">{label}</dt>
      <dd
        className={`break-words text-[14px] leading-relaxed text-white/[0.92] ${
          mono ? "font-mono text-[13px] text-white/[0.88]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
