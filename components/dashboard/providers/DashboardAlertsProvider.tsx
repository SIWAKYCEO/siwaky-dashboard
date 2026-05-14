"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { lineRevenue, formatSar } from "@/lib/dashboard/kpi";
import type { OrderRow } from "@/lib/dashboard/types";

import { OrderToastStack, type OrderToastRecord } from "@/components/dashboard/notifications/OrderToastStack";

/** Optional WAV — if missing, a Web Audio synthetic chime is used (always works after unlock). */
export const ORDER_ARRIVAL_SOUND_SRC = "/sounds/order-arrival.wav";

function getAudioContextCtor(): (typeof AudioContext) | null {
  if (typeof window === "undefined") return null;
  const Win = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return Win.AudioContext ?? Win.webkitAudioContext ?? null;
}

/** Shopify-style bright three-note chime — no asset file required. */
function playSyntheticOrderChime(ctx: AudioContext): void {
  const t = ctx.currentTime;
  const bus = ctx.createGain();
  bus.gain.value = 0.32;
  bus.connect(ctx.destination);

  const freqs = [698.46, 880.0, 1046.5]; // F5 A5 C6 — retail ping
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

type Ctx = {
  alertsChannelReady: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  toastEnabled: boolean;
  setToastEnabled: (v: boolean) => void;
  audioUnlocked: boolean;
  signalNewOrders: (orders: OrderRow[]) => void;
  /** Idempotent unlock — call from gestures / Sound toggle / Enable sound control */
  primeDashboardAudio: () => Promise<void>;
  /** Short preview after enabling sound (respects autoplay unlock). */
  previewOrderChime: () => Promise<boolean>;
};

const DashboardAlertsContext = createContext<Ctx | null>(null);

export function DashboardAlertsProvider({ children }: { children: ReactNode }) {
  const initialSoundEnv =
    typeof process.env.NEXT_PUBLIC_ORDER_ALERT_SOUND === "string"
      ? process.env.NEXT_PUBLIC_ORDER_ALERT_SOUND !== "false"
      : true;

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [decodeReady, setDecodeReady] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(initialSoundEnv);
  const [toastEnabled, setToastEnabledState] = useState(true);

  const [toasts, setToasts] = useState<OrderToastRecord[]>([]);

  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const decodedBufferRef = useRef<AudioBuffer | null>(null);
  const gesturePrimedRef = useRef(false);
  const pendingChimeRef = useRef(false);
  const toastTimersRef = useRef<Map<string, number>>(new Map());
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

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

  /** Decode WAV when present — synthetic path works regardless. */
  useEffect(() => {
    let cancelled = false;

    const html = new Audio();
    html.preload = "auto";
    html.crossOrigin = "anonymous";
    html.src = ORDER_ARRIVAL_SOUND_SRC;
    html.load();
    htmlAudioRef.current = html;

    void (async () => {
      try {
        const Ctor = getAudioContextCtor();
        if (!Ctor) {
          if (!cancelled) setDecodeReady(true);
          return;
        }
        const ctx = audioCtxRef.current ?? new Ctor();
        audioCtxRef.current = ctx;

        const res = await fetch(ORDER_ARRIVAL_SOUND_SRC, { cache: "force-cache", credentials: "same-origin" });
        if (!res.ok) throw new Error(`wav ${res.status}`);
        const raw = await res.arrayBuffer();
        const buf = await ctx.decodeAudioData(raw.slice(0));
        if (!cancelled) decodedBufferRef.current = buf;
      } catch {
        decodedBufferRef.current = null;
      } finally {
        if (!cancelled) setDecodeReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const playOrderChime = useCallback(async (): Promise<boolean> => {
    const ctxExisting = audioCtxRef.current;
    const Ctor = getAudioContextCtor();

    try {
      const ctx =
        ctxExisting ??
        (Ctor
          ? new Ctor()
          : (() => {
              throw new Error("no AudioContext");
            })());
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const buf = decodedBufferRef.current;
      if (decodeReady && buf) {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const gain = ctx.createGain();
        gain.gain.value = 0.34;
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
        return true;
      }

      playSyntheticOrderChime(ctx);
      return true;
    } catch {
      /* fall through */
    }

    try {
      const html = htmlAudioRef.current;
      if (html) {
        html.pause();
        html.currentTime = 0;
        html.volume = 0.42;
        await html.play();
        return true;
      }
    } catch {
      /* fall through */
    }

    try {
      const ctx = audioCtxRef.current ?? (Ctor ? new Ctor() : null);
      if (!ctx) return false;
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      playSyntheticOrderChime(ctx);
      return true;
    } catch {
      return false;
    }
  }, [decodeReady]);

  const flushPendingChime = useCallback(() => {
    if (!pendingChimeRef.current || !soundEnabledRef.current) return;
    pendingChimeRef.current = false;
    void playOrderChime();
  }, [playOrderChime]);

  const primeDashboardAudio = useCallback(async (): Promise<void> => {
    const Ctor = getAudioContextCtor();
    try {
      const ctx = audioCtxRef.current ?? (Ctor ? new Ctor() : null);
      if (ctx) {
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume();
      }
    } catch {
      /* ignore */
    }

    try {
      const html = htmlAudioRef.current;
      if (html) {
        html.muted = true;
        html.volume = 0;
        await html.play();
        html.pause();
        html.currentTime = 0;
        html.muted = false;
        html.volume = 0.42;
      }
    } catch {
      /* ignore */
    }

    setAudioUnlocked(true);
    flushPendingChime();
  }, [flushPendingChime]);

  useEffect(() => {
    const onGesture = () => {
      if (gesturePrimedRef.current) return;
      gesturePrimedRef.current = true;
      void primeDashboardAudio();
    };

    window.addEventListener("pointerdown", onGesture, { capture: true, passive: true });
    window.addEventListener("keydown", onGesture, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", onGesture, { capture: true });
      window.removeEventListener("keydown", onGesture, { capture: true });
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
        if (audioUnlocked) void playOrderChime();
        else pendingChimeRef.current = true;
      }
    },
    [audioUnlocked, dismissToast, playOrderChime, soundEnabled, toastEnabled],
  );

  useEffect(
    () => () => {
      for (const t of toastTimersRef.current.values()) window.clearTimeout(t);
      toastTimersRef.current.clear();
    },
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      alertsChannelReady: process.env.NEXT_PUBLIC_DASHBOARD_AUTH_READY === "true",
      soundEnabled,
      setSoundEnabled,
      toastEnabled,
      setToastEnabled,
      audioUnlocked,
      signalNewOrders,
      primeDashboardAudio,
      previewOrderChime: playOrderChime,
    }),
    [
      audioUnlocked,
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
