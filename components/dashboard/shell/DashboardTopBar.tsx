"use client";

import type { ReactNode } from "react";

import { Menu, RefreshCw } from "lucide-react";

import type { OrdersPayload } from "@/lib/dashboard/types";

type Props = {
  syncing: boolean;
  lastSyncIso: string | null;
  onRefresh: () => void;
  onOpenDrawer: () => void;
  pwaInstall: ReactNode | null;
  payload: OrdersPayload | null;
};

function formatSyncedLabel(iso: string | null): string {
  if (iso == null) return "Awaiting first sync…";
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "Awaiting first sync…";
  const minutes = Math.round((Date.now() - parsed) / 60000);
  const rtf = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
    style: "narrow",
  });
  const abs = Math.abs(minutes);
  if (abs < 1) return rtf.format(0, "second");
  if (abs < 120) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (abs < 3360) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  return rtf.format(-days, "day");
}

export function DashboardTopBar({
  syncing,
  lastSyncIso,
  onRefresh,
  onOpenDrawer,
  pwaInstall,
  payload,
}: Props) {
  return (
    <header
      dir="ltr"
      className="sticky top-0 z-30 w-full min-w-0 overflow-x-hidden backdrop-blur-2xl"
    >
      <div className="w-full min-w-0 border-b border-white/[0.07] bg-[#28282a]/85 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
        <div className="relative w-full max-w-none px-4 py-4 sm:px-6">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-[2px] h-px max-w-full rounded-full bg-gradient-to-r from-transparent via-[#c9a962]/35 to-transparent sm:inset-x-6"
          />

          {/* Row: menu · title stack · compact actions */}
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
              <button
                type="button"
                aria-label="Open navigation"
                className="mt-[2px] flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/42 text-[#ebe2c9] shadow-inner xl:hidden"
                onClick={onOpenDrawer}
              >
                <Menu className="size-[18px] stroke-[1.6]" />
              </button>

              <div className="min-w-0 flex-1 text-left">
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/52">
                  <li>Operations</li>
                  <li aria-hidden className="select-none text-white/18">
                    ·
                  </li>
                  <li className="text-siwaky-muted">Telemetry</li>
                  <li aria-hidden className="select-none text-white/18">
                    /
                  </li>
                  <li className="text-white">Dashboard</li>
                </ol>

                <h1 className="mt-2 max-w-full break-words font-dashDisplay text-[1.25rem] font-semibold tracking-tight text-white sm:text-2xl lg:max-w-[42rem] lg:text-[1.65rem]">
                  SIWAKY concierge intelligence
                </h1>

                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/42 px-3 py-1.5 font-dashSans text-[11px] text-white/70 shadow-inner backdrop-blur-md">
                    <AlarmClockPulse />
                    <span suppressHydrationWarning>{formatSyncedLabel(lastSyncIso)}</span>
                    {payload != null ? (
                      <span className="border-l border-white/10 pl-2 text-[10px] uppercase tracking-[0.18em] text-white/52 tabular-nums">
                        {payload.count.toLocaleString("en-US")} rows
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-row flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end sm:gap-3">
              {pwaInstall}
              <button
                type="button"
                onClick={() => void onRefresh()}
                disabled={syncing}
                className="relative inline-flex min-h-[42px] min-w-[42px] items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.08] via-black/45 to-black/62 px-4 py-2 font-dashSans text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_14px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md motion-safe:before:pointer-events-none motion-safe:before:absolute motion-safe:before:inset-0 motion-safe:before:bg-gradient-to-r motion-safe:before:from-transparent motion-safe:before:via-white/[0.08] motion-safe:before:to-transparent motion-safe:before:animate-dashScan disabled:opacity-45"
                aria-busy={syncing}
                aria-label="Synchronize workbook snapshot"
              >
                <RefreshCw
                  className={`size-4 ${syncing ? "animate-spin motion-reduce:animate-none" : ""}`}
                  aria-hidden
                  strokeWidth={1.8}
                />
                <span className="relative sm:inline">Sync</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function AlarmClockPulse() {
  return (
    <span className="relative flex size-[9px] shrink-0" aria-hidden>
      <span className="absolute inline-flex size-full rounded-full bg-emerald-300/92 opacity-80 motion-safe:animate-ping motion-reduce:animate-none" />
      <span className="relative inline-flex size-[9px] rounded-full bg-emerald-200 shadow-[0_0_14px_-2px_rgba(167,253,207,0.8)] ring-4 ring-emerald-500/35" />
    </span>
  );
}
