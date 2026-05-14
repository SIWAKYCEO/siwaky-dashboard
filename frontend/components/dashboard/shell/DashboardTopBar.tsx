"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Bell, BellOff, LogOut, Menu, RefreshCw, Volume2, VolumeX } from "lucide-react";

import { useDashboardAlerts } from "@/components/dashboard/providers/DashboardAlertsProvider";
import type { OrdersPayload } from "@/lib/dashboard/types";

type Props = {
  syncing: boolean;
  lastSyncIso: string | null;
  onRefresh: () => void;
  onOpenDrawer: () => void;
  pwaInstall: ReactNode | null;
  payload: OrdersPayload | null;
  viewerEmail?: string | null;
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
  viewerEmail,
}: Props) {
  const {
    soundEnabled,
    setSoundEnabled,
    toastEnabled,
    setToastEnabled,
    audioUnlocked,
    primeDashboardAudio,
    previewOrderChime,
  } = useDashboardAlerts();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/dashboard/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "/dashboard/login";
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header
      dir="ltr"
      className="sticky top-0 z-40 w-full min-w-0 overflow-visible backdrop-blur-2xl"
    >
      <div className="relative z-0 w-full min-w-0 overflow-visible border-b border-white/[0.07] bg-[#28282a]/85 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
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
                  <li>SIWAKY</li>
                  <li aria-hidden className="select-none text-white/18">
                    ·
                  </li>
                  <li className="text-siwaky-muted">Team</li>
                  <li aria-hidden className="select-none text-white/18">
                    /
                  </li>
                  <li className="text-white">Orders dashboard</li>
                </ol>

                <h1 className="mt-2 max-w-full break-words font-dashDisplay text-[1.25rem] font-semibold tracking-tight text-white sm:text-2xl lg:max-w-[42rem] lg:text-[1.65rem]">
                  SIWAKY order operations
                </h1>

                <div className="relative z-[1] mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 overflow-visible pb-1 pt-0.5">
                  <span className="relative z-[2] inline-flex items-center gap-2 overflow-visible rounded-full border border-white/[0.08] bg-black/42 px-3 py-2 font-dashSans text-[11px] text-white/70 shadow-inner backdrop-blur-md">
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

            <div className="relative z-[2] flex w-full shrink-0 flex-row flex-wrap items-center justify-start gap-2 overflow-visible pb-0.5 sm:w-auto sm:justify-end sm:gap-3">
              {viewerEmail ? (
                <span
                  className="hidden max-w-[11rem] truncate rounded-full border border-white/[0.08] bg-black/38 px-3 py-2 font-dashSans text-[11px] text-white/62 shadow-inner backdrop-blur-md lg:inline"
                  title={viewerEmail}
                >
                  {viewerEmail}
                </span>
              ) : null}
              {pwaInstall}
              <button
                type="button"
                onClick={() => setToastEnabled(!toastEnabled)}
                className="relative inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-black/42 px-3 py-2 font-dashSans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/82 shadow-inner backdrop-blur-md motion-safe:hover:border-[#c9a962]/38"
                aria-pressed={toastEnabled}
                title={
                  toastEnabled
                    ? "Order toast alerts on — tap to mute banners"
                    : "Toast alerts muted — tap to show new-order banners"
                }
              >
                {toastEnabled ? (
                  <Bell className="size-[17px] text-[#ebe2c9]" aria-hidden strokeWidth={1.65} />
                ) : (
                  <BellOff className="size-[17px] text-white/58" aria-hidden strokeWidth={1.65} />
                )}
                <span className="relative hidden sm:inline">Alerts</span>
              </button>
              <button
                type="button"
                onPointerDown={() => void primeDashboardAudio()}
                onClick={() =>
                  void (async () => {
                    await primeDashboardAudio();
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    if (next) await previewOrderChime();
                  })()
                }
                className={`relative inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border bg-black/42 px-3 py-2 font-dashSans text-[10px] font-semibold uppercase tracking-[0.18em] shadow-inner backdrop-blur-md motion-safe:hover:border-[#c9a962]/38 ${
                  soundEnabled && !audioUnlocked
                    ? "border-amber-400/35 ring-1 ring-amber-400/25"
                    : "border-white/[0.1]"
                } text-white/82`}
                aria-pressed={soundEnabled}
                title={
                  audioUnlocked
                    ? soundEnabled
                      ? "Order chime on — tap to mute sound"
                      : "Sound muted — tap for Shopify-style chime on new orders"
                    : "Tap Enable sound — browsers block audio until you interact (then new orders will chime)"
                }
              >
                {soundEnabled ? (
                  <Volume2 className="size-[17px] text-emerald-200/95" aria-hidden strokeWidth={1.65} />
                ) : (
                  <VolumeX className="size-[17px] text-white/58" aria-hidden strokeWidth={1.65} />
                )}
                <span className="relative hidden sm:inline">
                  {!audioUnlocked && soundEnabled ? "Enable sound" : "Sound"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                disabled={loggingOut}
                className="relative inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-black/42 px-3 py-2 font-dashSans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/82 shadow-inner backdrop-blur-md motion-safe:hover:border-rose-400/35 motion-safe:hover:text-rose-100 disabled:opacity-45"
                aria-label="Sign out"
              >
                <LogOut className="size-[17px]" aria-hidden strokeWidth={1.65} />
                <span className="relative hidden sm:inline">{loggingOut ? "…" : "Logout"}</span>
              </button>
              <button
                type="button"
                onClick={() => void onRefresh()}
                disabled={syncing}
                className="relative inline-flex min-h-[42px] min-w-[42px] items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.08] via-black/45 to-black/62 px-4 py-2 font-dashSans text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_14px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md motion-safe:before:pointer-events-none motion-safe:before:absolute motion-safe:before:inset-0 motion-safe:before:bg-gradient-to-r motion-safe:before:from-transparent motion-safe:before:via-white/[0.08] motion-safe:before:to-transparent motion-safe:before:animate-dashScan disabled:opacity-45"
                aria-busy={syncing}
                aria-label="Refresh orders from API"
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
    <span
      className="relative flex h-[22px] w-[22px] shrink-0 items-center justify-center overflow-visible"
      aria-hidden
    >
      <span className="pointer-events-none absolute left-1/2 top-1/2 size-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/85 opacity-80 motion-safe:animate-ping motion-reduce:animate-none" />
      <span className="relative inline-flex size-[9px] rounded-full bg-emerald-200 shadow-[0_0_14px_-2px_rgba(167,253,207,0.86)] ring-[3px] ring-emerald-500/38" />
    </span>
  );
}
