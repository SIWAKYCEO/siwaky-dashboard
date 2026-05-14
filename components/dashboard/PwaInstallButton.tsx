"use client";

import { useCallback, useEffect, useState } from "react";

/** Chromium `beforeinstallprompt` (non standard; cast for TS). */
type DeferredInstallPrompt = Event & {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function useInstallLabel(): { primary: string; aria: string } {
  const [localeAr, setLocaleAr] = useState(false);

  useEffect(() => {
    try {
      setLocaleAr(
        (navigator.language || "").toLowerCase().startsWith("ar") ||
          (navigator.languages || []).some((l) => l.toLowerCase().startsWith("ar")),
      );
    } catch {
      setLocaleAr(false);
    }
  }, []);

  return {
    primary: localeAr ? "تثبيت التطبيق" : "Install App",
    aria: "Install App — تثبيت التطبيق",
  };
}

/** PWA prompt button — only renders when Chromium fires `beforeinstallprompt`. Visible on `/dashboard` only (see usage). */
export function PwaInstallButton({ className = "" }: { className?: string }) {
  const { primary, aria } = useInstallLabel();
  const [deferredPrompt, setDeferredPrompt] =
    useState<DeferredInstallPrompt | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as DeferredInstallPrompt);
    };

    const onInstalled = () => {
      setHidden(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let standalone = false;
    try {
      standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
    } catch {
      standalone = false;
    }
    if (standalone) setHidden(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const activate = useCallback(async () => {
    const evt = deferredPrompt;
    if (!evt?.prompt) return;
    await evt.prompt();
    setDeferredPrompt(null);
    try {
      await evt.userChoice;
    } catch {
      /* ignore */
    }
  }, [deferredPrompt]);

  if (hidden || !deferredPrompt) return null;

  return (
    <button
      type="button"
      aria-label={aria}
      onClick={() => void activate()}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-[#c9a962]/40 bg-white/[0.06] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ebe2c9] shadow-glass backdrop-blur-md motion-safe:transition-colors motion-safe:duration-200 hover:bg-white/[0.12] hover:border-[#c9a962]/60 ${className}`}
    >
      {primary}
    </button>
  );
}
