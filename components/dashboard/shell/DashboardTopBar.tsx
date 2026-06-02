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
  syncError?: string | null;
};

export function DashboardTopBar({
  syncing,
  lastSyncIso: _lastSyncIso,
  onRefresh,
  onOpenDrawer,
  pwaInstall,
  payload: _payload,
  viewerEmail,
  syncError,
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

  const [loggingOut,  setLoggingOut]  = useState(false);
  const [pushBusy,    setPushBusy]    = useState(false);
  const [pushOn,      setPushOn]      = useState(false);
  const [pushError,   setPushError]   = useState<string | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [pushCapable, setPushCapable] = useState(false);
  const [iosStandaloneOk, setIosStandaloneOk] = useState(true);
  const wakeSentinelRef = useRef<{ release: () => Promise<void> } | null>(null);
  const [clientReady, setClientReady] = useState(false);

  // "Updated just now" feedback
  const prevSyncingRef = useRef(syncing);
  const [syncDoneMsg, setSyncDoneMsg] = useState<string | null>(null);

  useEffect(() => { setClientReady(true); }, []);

  useEffect(() => {
    // Transition syncing true → false means sync just finished
    if (prevSyncingRef.current && !syncing) {
      setSyncDoneMsg(syncError ? null : "Updated just now");
      const t = setTimeout(() => setSyncDoneMsg(null), 4000);
      prevSyncingRef.current = syncing;
      return () => clearTimeout(t);
    }
    prevSyncingRef.current = syncing;
  }, [syncing, syncError]);

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
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
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
        if (cancelled) { await sentinel.release(); return; }
        wakeSentinelRef.current = sentinel;
      } catch { /* policy / unsupported */ }
    }
    void acquire();
    const onVis = () => { if (document.visibilityState === "visible") void acquire(); };
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
      await reg.showNotification("SIWAKY", {
        body: "Notifications enabled.",
        icon: "/icons/icon-192x192.png",
        tag: "siwaky-local-test",
      });
    } catch { /* ignore */ }
    try {
      const tr = await fetch("/api/dashboard/push/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!tr.ok) {
        let msg = `Test server (${tr.status})`;
        try { const j = (await tr.json()) as { error?: string }; msg = j.error || msg; } catch { /* ignore */ }
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
    setPushBusy(true); setPushError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) { setPushError("No push subscription — re-enable notifications."); return; }
      await runPostEnableChecks(reg, sub);
    } finally { setPushBusy(false); }
  }

  async function enableNotifications() {
    if (!pushCapable) return;
    setPushBusy(true); setPushError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setPushError("Notification permission denied"); return; }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const vapidRes = await fetch("/api/dashboard/push/vapid");
      if (!vapidRes.ok) { setPushError("VAPID error"); return; }
      const { publicKey } = (await vapidRes.json()) as { publicKey: string };
      if (!publicKey) { setPushError("Missing public key from server"); return; }
      let sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const save = await fetch("/api/dashboard/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!save.ok) { setPushError("Subscribe save failed"); return; }
      setPushOn(true);
      void runPostEnableChecks(reg, sub);
    } catch (e) {
      setPushError(e instanceof Error ? e.message : "Push setup failed");
    } finally { setPushBusy(false); }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/dashboard/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "/dashboard/login";
    } finally { setLoggingOut(false); }
  }

  // ── Sync button (shared between mobile and desktop) ───────────────────────
  const syncBtn = (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void onRefresh()}
        disabled={syncing}
        className="relative inline-flex min-h-[42px] min-w-[42px] items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.08] via-black/45 to-black/62 px-4 py-2 font-dashSans text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_14px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md motion-safe:before:pointer-events-none motion-safe:before:absolute motion-safe:before:inset-0 motion-safe:before:bg-gradient-to-r motion-safe:before:from-transparent motion-safe:before:via-white/[0.08] motion-safe:before:to-transparent motion-safe:before:animate-dashScan disabled:opacity-45"
        aria-busy={syncing}
        aria-label="Refresh orders from API"
      >
        <RefreshCw
          className={"size-4 " + (syncing ? "animate-spin motion-reduce:animate-none" : "")}
          aria-hidden
          strokeWidth={1.8}
        />
        <span className="relative">Sync</span>
      </button>
      {syncDoneMsg && !syncError ? (
        <span className="text-[10px] font-semibold text-emerald-400/90">{syncDoneMsg}</span>
      ) : null}
      {syncError ? (
        <span className="max-w-[140px] text-right text-[9px] leading-snug text-rose-300/90">{syncError.slice(0, 60)}</span>
      ) : null}
    </div>
  );

  return (
    <header dir="ltr" className="sticky top-0 z-40 w-full min-w-0 overflow-visible backdrop-blur-2xl">
      <div className="relative z-0 w-full min-w-0 overflow-visible border-b border-white/[0.07] bg-[#28282a]/85 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
        <div className="relative w-full max-w-none px-4 py-3 sm:px-6">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-[2px] h-px max-w-full rounded-full bg-gradient-to-r from-transparent via-[#c9a962]/35 to-transparent sm:inset-x-6"
          />

          {/* ── Mobile header (< xl): hamburger + logo + sync ── */}
          <div className="flex items-center justify-between xl:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/42 text-[#ebe2c9] shadow-inner"
                onClick={onOpenDrawer}
              >
                <Menu className="size-[18px] stroke-[1.6]" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="SIWAKY"
                style={{ height: 60, width: "auto", objectFit: "contain" }}
              />
            </div>
            {syncBtn}
          </div>

          {/* ── Desktop header (≥ xl): logo left + all buttons right ── */}
          <div className="hidden xl:flex xl:items-center xl:justify-between xl:gap-6">
            {/* Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="SIWAKY"
              style={{ height: 80, width: "auto", objectFit: "contain" }}
            />

            {/* Action buttons */}
            <div className="relative z-[2] flex shrink-0 flex-row flex-wrap items-center justify-end gap-2 overflow-visible sm:gap-3">
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
                    >
                      <Smartphone className="size-[17px] text-sky-200/95" aria-hidden strokeWidth={1.65} />
                      <span className="relative hidden sm:inline">
                        {pushOn ? "Push on" : pushBusy ? "..." : "Enable notifications"}
                      </span>
                    </button>
                    {pushOn ? (
                      <button
                        type="button"
                        onClick={() => void retestNotifications()}
                        disabled={pushBusy}
                        className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-950/35 px-2.5 py-2 font-dashSans text-[9px] font-semibold uppercase tracking-[0.16em] text-sky-100/90 shadow-inner backdrop-blur-md disabled:opacity-45"
                      >
                        Test
                      </button>
                    ) : null}
                  </div>
                  {clientReady && isIosLike() && !iosStandaloneOk ? (
                    <p className="rounded-lg border border-amber-500/25 bg-amber-950/25 px-2 py-1.5 font-dashSans text-[9px] leading-snug text-amber-100/85" dir="ltr">
                      On iPhone, add to Home Screen to receive push notifications.
                    </p>
                  ) : null}
                  {pushOn && supportsScreenWakeLock() ? (
                    <p className="px-0.5 font-dashSans text-[8px] leading-snug text-white/38" dir="ltr">
                      Screen stays awake while on this tab.
                    </p>
                  ) : null}
                  {showIosHint ? (
                    <p className="px-0.5 text-center font-dashSans text-[9px] leading-snug text-white/45 sm:text-left" dir="rtl">
                      افتح Safari → شارك → أضف للشاشة الرئيسية
                    </p>
                  ) : null}
                  {pushError ? (
                    <span className="px-0.5 text-left text-[9px] text-rose-300/90">{pushError.length > 72 ? pushError.slice(0, 72) + "..." : pushError}</span>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setToastEnabled(!toastEnabled)}
                className="relative inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-black/42 px-3 py-2 font-dashSans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/82 shadow-inner backdrop-blur-md motion-safe:hover:border-[#c9a962]/38"
                aria-pressed={toastEnabled}
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
                className={"relative inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border bg-black/42 px-3 py-2 font-dashSans text-[10px] font-semibold uppercase tracking-[0.18em] shadow-inner backdrop-blur-md motion-safe:hover:border-[#c9a962]/38 " + (soundEnabled && !audioUnlocked ? "border-amber-400/35 ring-1 ring-amber-400/25" : "border-white/[0.1]") + " text-white/82"}
                aria-pressed={soundEnabled}
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
                <span className="relative hidden sm:inline">{loggingOut ? "..." : "Logout"}</span>
              </button>

              {syncBtn}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
