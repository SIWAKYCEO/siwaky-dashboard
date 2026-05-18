"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { usePathname } from "next/navigation";

import { lineRevenue, formatSar } from "@/lib/dashboard/kpi";
import type { OrderRow } from "@/lib/dashboard/types";

import { OrderToastStack, type OrderToastRecord } from "@/components/dashboard/notifications/OrderToastStack";

/** Persisted in Next `public/sounds/` → URL path below (see `public/sounds/kaching.mp3`). */
export const ORDER_ALERT_SOUND_SRC = "/sounds/kaching.mp3";
/** @deprecated use ORDER_ALERT_SOUND_SRC */
export const ORDER_ARRIVAL_SOUND_SRC = ORDER_ALERT_SOUND_SRC;

/** User finished the “Enable notification sound” banner; exact key requested for the unlock CTA. */
export const DASHBOARD_AUDIO_ENABLED_LS_KEY = "audioEnabled";

/** `<audio>` output is 0–1 (browser cap). */
const ORDER_CHIME_HTML_VOLUME = 1;
/** Boost decoded MP3 in Web Audio (asset is fairly quiet). */
const ORDER_CHIME_BUFFER_GAIN = 2.55;
/** Synthetic fallback bus level. */
const ORDER_CHIME_SYNTH_BUS_GAIN = 1.28;

function dashAudioLog(...args: unknown[]) {
  if (typeof console !== "undefined" && console.warn) {
    console.warn("[dash-audio]", ...args);
  }
}

/** Absolute URL for fetch / Audio (works with subpaths if ever added to next.config). */
function soundFileUrl(): string {
  if (typeof window === "undefined") return ORDER_ALERT_SOUND_SRC;
  return new URL(ORDER_ALERT_SOUND_SRC, window.location.origin).href;
}

function getAudioContextCtor(): (typeof AudioContext) | null {
  if (typeof window === "undefined") return null;
  const Win = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return Win.AudioContext ?? Win.webkitAudioContext ?? null;
}

function playSyntheticOrderChime(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const bus = ctx.createGain();
  bus.gain.value = ORDER_CHIME_SYNTH_BUS_GAIN;
  bus.connect(ctx.destination);

  const freqs = [698.46, 880.0, 1046.5];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t + i * 0.068);
    const st = t + i * 0.068;
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(0.22, st + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, st + 0.34);
    osc.connect(g);
    g.connect(bus);
    osc.start(st);
    osc.stop(st + 0.38);
  });
}

function createPreloadAudioElement(): HTMLAudioElement {
  const el = new Audio();
  el.preload = "auto";
  el.src = soundFileUrl();
  try {
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "true");
  } catch {
    /* ignore */
  }
  el.load();
  return el;
}

type Ctx = {
  alertsChannelReady: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  toastEnabled: boolean;
  setToastEnabled: (v: boolean) => void;
  audioUnlocked: boolean;
  /** True when sound is on but browser has not yet allowed playback (autoplay policy). */
  needsSoundInteraction: boolean;
  soundAssetStatus: "loading" | "ready" | "decode-failed";
  signalNewOrders: (orders: OrderRow[]) => void;
  primeDashboardAudio: () => Promise<void>;
  previewOrderChime: () => Promise<boolean>;
};

const DashboardAlertsContext = createContext<Ctx | null>(null);

function SoundUnlockBanner({
  visible,
  onEnable,
}: {
  visible: boolean;
  onEnable: () => void;
}) {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[2100] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
      role="status"
    >
      <div className="pointer-events-auto flex max-w-lg flex-col gap-2 rounded-2xl border border-amber-400/35 bg-[#1e1e22]/95 px-4 py-3 text-center shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 sm:text-left">
        <p className="font-dashSans text-[12px] leading-snug text-white/88">
          Tap to enable notification sound — your browser blocks audio until you interact.
        </p>
        <button
          type="button"
          className="shrink-0 rounded-xl border border-[#c9a962]/50 bg-[#c9a962]/20 px-4 py-2.5 font-dashSans text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5efd9] motion-safe:transition-colors hover:bg-[#c9a962]/35"
          onClick={() => onEnable()}
        >
          Enable notification sound
        </button>
      </div>
    </div>
  );
}

export function DashboardAlertsProvider({ children }: { children: ReactNode }) {
  const initialSoundEnv =
    typeof process.env.NEXT_PUBLIC_ORDER_ALERT_SOUND === "string"
      ? process.env.NEXT_PUBLIC_ORDER_ALERT_SOUND !== "false"
      : true;

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [decodeReady, setDecodeReady] = useState(false);
  const [soundAssetStatus, setSoundAssetStatus] = useState<"loading" | "ready" | "decode-failed">(
    "loading",
  );
  const [soundEnabled, setSoundEnabledState] = useState(initialSoundEnv);
  const [toastEnabled, setToastEnabledState] = useState(true);

  const pathname = usePathname();
  const isDashboardLoginPage =
    pathname === "/dashboard/login" || pathname === "/dashboard/login/";

  const [soundBannerAcknowledged, setSoundBannerAcknowledged] = useState(false);
  const [soundBannerGrace, setSoundBannerGrace] = useState(false);

  useLayoutEffect(() => {
    try {
      if (window.localStorage.getItem(DASHBOARD_AUDIO_ENABLED_LS_KEY) === "true") {
        setSoundBannerAcknowledged(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const [toasts, setToasts] = useState<OrderToastRecord[]>([]);

  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const decodedBufferRef = useRef<AudioBuffer | null>(null);
  const pendingChimeRef = useRef(false);
  const toastTimersRef = useRef<Map<string, number>>(new Map());
  const soundUnlockDismissTimerRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const audioUnlockedRef = useRef(audioUnlocked);
  soundEnabledRef.current = soundEnabled;
  audioUnlockedRef.current = audioUnlocked;

  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
    try {
      window.localStorage.setItem("siwaky_dash_sound", v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const setToastEnabled = useCallback((v: boolean) => {
    setToastEnabledState(v);
    try {
      window.localStorage.setItem("siwaky_dash_toast", v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const sSound = window.localStorage.getItem("siwaky_dash_sound");
      if (sSound === "1") setSoundEnabledState(true);
      if (sSound === "0") setSoundEnabledState(false);
      const sToast = window.localStorage.getItem("siwaky_dash_toast");
      if (sToast === "1") setToastEnabledState(true);
      if (sToast === "0") setToastEnabledState(false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const html = createPreloadAudioElement();
    htmlAudioRef.current = html;

    const onCanPlay = () => {
      if (cancelled) return;
      dashAudioLog("sound loaded (HTMLAudio can play)", ORDER_ALERT_SOUND_SRC, soundFileUrl());
    };
    html.addEventListener("canplaythrough", onCanPlay, { once: true });
    html.addEventListener("error", () => {
      if (cancelled) return;
      dashAudioLog("sound preload error (HTMLAudio)", ORDER_ALERT_SOUND_SRC);
    });

    void (async () => {
      try {
        const Ctor = getAudioContextCtor();
        if (!Ctor) {
          if (!cancelled) {
            setDecodeReady(true);
            setSoundAssetStatus("decode-failed");
          }
          return;
        }
        const ctx = audioCtxRef.current ?? new Ctor();
        audioCtxRef.current = ctx;

        const url = soundFileUrl();
        const res = await fetch(ORDER_ALERT_SOUND_SRC, {
          cache: "force-cache",
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${ORDER_ALERT_SOUND_SRC}`);
        const raw = await res.arrayBuffer();
        if (raw.byteLength < 100) throw new Error("sound file too small");

        const copy = raw.slice(0);
        const buf = await ctx.decodeAudioData(copy);
        if (!cancelled) {
          decodedBufferRef.current = buf;
          setSoundAssetStatus("ready");
          dashAudioLog("sound decoded for Web Audio (buffer)", buf.duration.toFixed(2) + "s", url);
        }
      } catch (e) {
        decodedBufferRef.current = null;
        if (!cancelled) {
          setSoundAssetStatus("decode-failed");
          dashAudioLog("decodeAudioData failed — will use <audio> MP3 path", e);
        }
      } finally {
        if (!cancelled) setDecodeReady(true);
      }
    })();

    return () => {
      cancelled = true;
      html.removeEventListener("canplaythrough", onCanPlay);
    };
  }, []);

  const playHtmlMp3 = useCallback(async (): Promise<boolean> => {
    const html = htmlAudioRef.current;
    if (!html) {
      dashAudioLog("play MP3: no HTMLAudio element");
      return false;
    }
    try {
      if (html.src !== soundFileUrl()) {
        html.src = soundFileUrl();
        html.load();
      }
      html.muted = false;
      html.volume = ORDER_CHIME_HTML_VOLUME;
      await html.play();
      dashAudioLog("play success (<audio> MP3)", ORDER_ALERT_SOUND_SRC);
      return true;
    } catch (e) {
      dashAudioLog("play failure (<audio> MP3)", e);
      return false;
    }
  }, []);

  const playOrderChime = useCallback(async (): Promise<boolean> => {
    dashAudioLog("play triggered");

    const Ctor = getAudioContextCtor();

    try {
      const ctx =
        audioCtxRef.current ??
        (Ctor
          ? new Ctor()
          : (() => {
              throw new Error("no AudioContext");
            })());
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") {
        await ctx.resume();
        dashAudioLog("AudioContext resumed ->", ctx.state);
      }

      const buf = decodedBufferRef.current;
      if (decodeReady && buf) {
        try {
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const gain = ctx.createGain();
          gain.gain.value = ORDER_CHIME_BUFFER_GAIN;
          src.connect(gain);
          gain.connect(ctx.destination);
          src.start();
          dashAudioLog("play success (Web Audio buffer)");
          return true;
        } catch (e) {
          dashAudioLog("play failure (Web Audio buffer), falling back", e);
        }
      }
    } catch (e) {
      dashAudioLog("Web Audio path error, trying <audio>", e);
    }

    const mp3Ok = await playHtmlMp3();
    if (mp3Ok) return true;

    try {
      const ctx = audioCtxRef.current ?? (Ctor ? new Ctor() : null);
      if (!ctx) {
        dashAudioLog("play failure — no AudioContext for synthetic");
        return false;
      }
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      playSyntheticOrderChime(ctx);
      dashAudioLog("play success (synthetic fallback)");
      return true;
    } catch (e) {
      dashAudioLog("play failure (synthetic)", e);
      return false;
    }
  }, [decodeReady, playHtmlMp3]);

  const flushPendingChime = useCallback(() => {
    if (!pendingChimeRef.current || !soundEnabledRef.current) return;
    pendingChimeRef.current = false;
    void playOrderChime();
  }, [playOrderChime]);

  const primeDashboardAudio = useCallback(async (): Promise<void> => {
    if (audioUnlockedRef.current) {
      dashAudioLog("prime: skip (already unlocked)");
      return;
    }

    const Ctor = getAudioContextCtor();
    let unlocked = false;

    try {
      const ctx = audioCtxRef.current ?? (Ctor ? new Ctor() : null);
      if (ctx) {
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume();
        if (ctx.state === "running") unlocked = true;
        dashAudioLog("prime: AudioContext", ctx.state);
      }
    } catch (e) {
      dashAudioLog("prime: AudioContext error", e);
    }

    try {
      const html = htmlAudioRef.current;
      if (html) {
        if (html.src !== soundFileUrl()) {
          html.src = soundFileUrl();
          html.load();
        }
        html.muted = true;
        html.volume = 0;
        await html.play();
        html.pause();
        html.currentTime = 0;
        html.muted = false;
        html.volume = ORDER_CHIME_HTML_VOLUME;
        unlocked = true;
        dashAudioLog("prime: muted HTMLAudio unlock OK");
      }
    } catch (e) {
      dashAudioLog("prime: muted HTMLAudio unlock failed", e);
    }

    if (unlocked) {
      setAudioUnlocked(true);
      dashAudioLog("audio unlocked");
      flushPendingChime();
    } else {
      dashAudioLog("audio still locked after prime");
    }
  }, [flushPendingChime]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    if (u.searchParams.get("dashPushChime") !== "1") return;
    u.searchParams.delete("dashPushChime");
    window.history.replaceState({}, "", `${u.pathname}${u.search}${u.hash}`);
    void (async () => {
      await primeDashboardAudio();
      await playOrderChime();
    })();
  }, [playOrderChime, primeDashboardAudio]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onMsg = (ev: MessageEvent) => {
      const t = (ev.data as { type?: string } | null)?.type;
      if (t === "SIWAKY_DASH_PLAY_KACHING") {
        void (async () => {
          await primeDashboardAudio();
          await playOrderChime();
        })();
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, [playOrderChime, primeDashboardAudio]);

  useEffect(() => {
    const tryPrimeUntilUnlocked = () => {
      if (audioUnlockedRef.current) return;
      void primeDashboardAudio();
    };

    window.addEventListener("pointerdown", tryPrimeUntilUnlocked, { capture: true, passive: true });
    window.addEventListener("keydown", tryPrimeUntilUnlocked, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", tryPrimeUntilUnlocked, { capture: true });
      window.removeEventListener("keydown", tryPrimeUntilUnlocked, { capture: true });
    };
  }, [primeDashboardAudio]);

  useEffect(() => {
    if (audioUnlocked) flushPendingChime();
  }, [audioUnlocked, flushPendingChime]);

  const dismissToast = useCallback((id: string) => {
    const t = toastTimersRef.current.get(id);
    if (t != null) window.clearTimeout(t);
    toastTimersRef.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const signalNewOrders = useCallback(
    (orders: OrderRow[]) => {
      if (orders.length === 0) return;

      if (toastEnabled) {
        const batch = orders.length;
        const primary = orders[0];
        const rev = lineRevenue(primary);
        const subtitleParts = [
          [primary.city?.trim(), primary.country?.trim()].filter(Boolean).join(", "),
          primary.phone?.trim(),
        ].filter(Boolean);

        const record: OrderToastRecord = {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          eyebrow: batch > 1 ? "Incoming orders" : "New order",
          headline:
            batch > 1 ? `${batch} new orders` : `${primary.product?.trim() || "Order"}`.slice(0, 72),
          subtitle:
            batch > 1
              ? `Latest: ${primary.product?.trim() || "Order"} · ${subtitleParts.join(" · ") || "Sheet"}`
              : subtitleParts.join(" · ") || "Incoming row from your sheet",
          amount: rev > 0 ? formatSar(rev) : undefined,
        };

        setToasts((prev) => [record, ...prev].slice(0, 5));

        const tid = window.setTimeout(() => dismissToast(record.id), 6800);
        toastTimersRef.current.set(record.id, tid);
      }

      if (soundEnabled) {
        dashAudioLog("new order signal → chime; unlocked=", audioUnlockedRef.current);
        if (audioUnlockedRef.current) void playOrderChime();
        else pendingChimeRef.current = true;
      }
    },
    [dismissToast, playOrderChime, soundEnabled, toastEnabled],
  );

  useEffect(
    () => () => {
      const t = soundUnlockDismissTimerRef.current;
      if (t != null) window.clearTimeout(t);
      soundUnlockDismissTimerRef.current = null;
    },
    [],
  );

  useEffect(
    () => () => {
      for (const t of toastTimersRef.current.values()) window.clearTimeout(t);
      toastTimersRef.current.clear();
    },
    [],
  );

  const needsSoundInteraction = soundEnabled && !audioUnlocked;

  const showSoundUnlockBanner =
    !isDashboardLoginPage &&
    !soundBannerAcknowledged &&
    (needsSoundInteraction || soundBannerGrace);

  const onBannerEnable = useCallback(() => {
    void (async () => {
      try {
        window.localStorage.setItem(DASHBOARD_AUDIO_ENABLED_LS_KEY, "true");
      } catch {
        /* ignore */
      }
      setSoundBannerGrace(true);
      await primeDashboardAudio();
      await playOrderChime();
      const prev = soundUnlockDismissTimerRef.current;
      if (prev != null) window.clearTimeout(prev);
      soundUnlockDismissTimerRef.current = window.setTimeout(() => {
        soundUnlockDismissTimerRef.current = null;
        setSoundBannerGrace(false);
        setSoundBannerAcknowledged(true);
      }, 5000);
    })();
  }, [primeDashboardAudio, playOrderChime]);

  const value = useMemo<Ctx>(
    () => ({
      alertsChannelReady: process.env.NEXT_PUBLIC_DASHBOARD_AUTH_READY === "true",
      soundEnabled,
      setSoundEnabled,
      toastEnabled,
      setToastEnabled,
      audioUnlocked,
      needsSoundInteraction,
      soundAssetStatus,
      signalNewOrders,
      primeDashboardAudio,
      previewOrderChime: playOrderChime,
    }),
    [
      audioUnlocked,
      needsSoundInteraction,
      soundAssetStatus,
      playOrderChime,
      primeDashboardAudio,
      signalNewOrders,
      soundEnabled,
      setSoundEnabled,
      toastEnabled,
      setToastEnabled,
    ],
  );

  return (
    <DashboardAlertsContext.Provider value={value}>
      {children}
      <OrderToastStack items={toasts} onDismiss={dismissToast} />
      <SoundUnlockBanner visible={showSoundUnlockBanner} onEnable={onBannerEnable} />
    </DashboardAlertsContext.Provider>
  );
}

export function useDashboardAlerts(): Ctx {
  const ctx = useContext(DashboardAlertsContext);
  if (!ctx) {
    throw new Error("useDashboardAlerts must be used inside DashboardAlertsProvider");
  }
  return ctx;
}
