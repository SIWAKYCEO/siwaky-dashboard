"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { Bell, BellOff, LogOut, Menu, RefreshCw, Smartphone, Volume2, VolumeX } from "lucide-react";

import { useDashboardAlerts } from "@/components/dashboard/providers/DashboardAlertsProvider";
import {
  isIosLike,
  isIosSafari,
  isStandaloneDisplayMode,
  supportsScreenWakeLock,
  urlBase64ToUint8Array,
} from "@/lib/dashboard/web-push";
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
  const [pushBusy, setPushBusy] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [pushCapable, setPushCapable] = useState(false);
  const [iosStandaloneOk, setIosStandaloneOk] = useState(true);
  const wakeSentinelRef = useRef<{ release: () => Promise<void> } | null>(null);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setShowIosHint(isIosSafari());
    setPushCapable(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window,
    );
    if (typeof window !== "undefined" && isIosLike()) {
      setIosStandaloneOk(isStandaloneDisplayMode());
    } else {
      setIosStandaloneOk(true);
    }
    void (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const existing = await reg?.pushManager.getSubscription();
        if (!cancelled && existing) setPushOn(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pushOn || !supportsScreenWakeLock()) return;

    let cancelled = false;

    async function acquire() {
      if (document.visibilityState !== "visible") return;
      try {
        const wn = navigator as Navigator & {
          wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
        };
        if (!wn.wakeLock?.request) return;
        const sentinel = await wn.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        wakeSentinelRef.current = sentinel;
      } catch {
        /* policy / unsupported */
      }
    }

    void acquire();

    const onVis = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      const s = wakeSentinelRef.current;
      wakeSentinelRef.current = null;
      void s?.release().catch(() => {});
    };
  }, [pushOn]);

  async function runPostEnableChecks(reg: ServiceWorkerRegistration, sub: PushSubscription) {
    try {
      await reg.showNotification("🌿 SIWAKY", {
        body: "Prova locale — se non vedi nulla, controlla i permessi nelle impostazioni del telefono.",
        icon: "/icons/icon-192x192.png",
        tag: "siwaky-local-test",
      });
    } catch {
      /* ignore */
    }
    try {
      const tr = await fetch("/api/dashboard/push/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!tr.ok) {
        let msg = `Test server (${tr.status})`;
        try {
          const j = (await tr.json()) as { error?: string; detail?: string };
          msg = j.detail || j.error || msg;
        } catch {
          /* ignore */
        }
        setPushError(msg);
      } else {
        setPushError(null);
      }
    } catch (e) {
      setPushError(e instanceof Error ? e.message : "Test push failed");
    }
  }

  async function retestNotifications() {
    if (!pushCapable || !pushOn) return;
    setPushBusy(true);
    setPushError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setPushError("Iscrizione push assente — riattiva le notifiche.");
        return;
      }
      await runPostEnableChecks(reg, sub);
    } finally {
      setPushBusy(false);
    }
  }

  async function enableNotifications() {
    if (!pushCapable) return;
    setPushBusy(true);
    setPushError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPushError("Notification permission denied");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await reg.ready;
      const vapidRes = await fetch("/api/dashboard/push/vapid");
      if (!vapidRes.ok) {
        let msg = `VAPID error (${vapidRes.status})`;
        try {
          const j = (await vapidRes.json()) as { error?: string; detail?: string };
          msg = j.detail || j.error || msg;
        } catch {
          /* ignore */
        }
        setPushError(msg);
        return;
      }
      const { publicKey } = (await vapidRes.json()) as { publicKey: string };
      if (!publicKey) {
        setPushError("Missing public key from server");
        return;
      }
      let sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const save = await fetch("/api/dashboard/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!save.ok) {
        let msg = `Subscribe save failed (${save.status})`;
        try {
          const j = (await save.json()) as { error?: string; detail?: string };
          msg = j.detail || j.error || msg;
        } catch {
          /* ignore */
        }
        setPushError(msg);
        return;
      }
      setPushOn(true);
      void runPostEnableChecks(reg, sub);
    } catch (e) {
      setPushError(e instanceof Error ? e.message : "Push setup failed");
    } finally {
      setPushBusy(false);
    }
  }

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
              {pushCapable ? (
                <div className="flex max-w-[15rem] flex-col gap-1 sm:max-w-none">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void enableNotifications()}
                      disabled={pushBusy || pushOn}
                      className="relative inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-black/42 px-3 py-2 font-dashSans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/82 shadow-inner backdrop-blur-md motion-safe:hover:border-[#c9a962]/38 disabled:cursor-not-allowed disabled:opacity-55"
                      aria-pressed={pushOn}
                      title={
                        pushOn
                          ? "Web push is enabled for this device"
                          : "Receive order alerts even when the dashboard is closed (HTTPS + supported browser)"
                      }
                    >
                      <Smartphone className="size-[17px] text-sky-200/95" aria-hidden strokeWidth={1.65} />
                      <span className="relative hidden sm:inline">
                        {pushOn ? "Push on" : pushBusy ? "…" : "Enable notifications"}
                      </span>
                    </button>
                    {pushOn ? (
                      <button
                        type="button"
                        onClick={() => void retestNotifications()}
                        disabled={pushBusy}
                        className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-950/35 px-2.5 py-2 font-dashSans text-[9px] font-semibold uppercase tracking-[0.16em] text-sky-100/90 shadow-inner backdrop-blur-md disabled:opacity-45"
                        title="Notifica di prova (locale + dal server)"
                      >
                        <span className="hidden sm:inline">Prova notifica</span>
                        <span className="sm:hidden">Prova</span>
                      </button>
                    ) : null}
                  </div>
                  {clientReady && isIosLike() && !iosStandaloneOk ? (
                    <p
                      className="rounded-lg border border-amber-500/25 bg-amber-950/25 px-2 py-1.5 font-dashSans text-[9px] leading-snug text-amber-100/85"
                      dir="ltr"
                    >
                      Su iPhone le notifiche push arrivano solo se apri il sito dall’icona nella Home (Aggiungi a
                      schermata Home). Nella scheda Safari di solito non funzionano. Non serve lasciare l’app sempre
                      aperta: le notifiche partono dal server quando arriva un ordine nuovo.
                    </p>
                  ) : null}
                  {pushOn && supportsScreenWakeLock() ? (
                    <p className="px-0.5 font-dashSans text-[8px] leading-snug text-white/38" dir="ltr">
                      Schermo resta acceso mentre sei in questo tab (opzionale). Per gli ordini, conta il server —
                      chiudi pure il dashboard.
                    </p>
                  ) : null}
                  {showIosHint ? (
                    <p
                      className="px-0.5 text-center font-dashSans text-[9px] leading-snug text-white/45 sm:text-left"
                      dir="rtl"
                    >
                      افتح Safari → شارك → أضف للشاشة الرئيسية
                    </p>
                  ) : null}
                  {pushError ? (
                    <span className="px-0.5 text-left text-[9px] text-rose-300/90" title={pushError}>
                      {pushError.length > 72 ? `${pushError.slice(0, 72)}…` : pushError}
                    </span>
                  ) : null}
                </div>
              ) : null}
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
