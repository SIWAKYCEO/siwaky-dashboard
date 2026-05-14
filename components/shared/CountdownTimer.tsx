"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * Per-session 24h rolling countdown. Stored in `sessionStorage` so a refresh
 * doesn't restart the timer (more credible to repeat visitors).
 */
export default function CountdownTimer({ label }: { label?: string }) {
  const translate = useTranslations("common");
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const KEY = "siwaky_cd_end";
    let end = Number(sessionStorage.getItem(KEY));
    const now = Date.now();
    if (!end || end - now <= 0) {
      end = now + 24 * 60 * 60 * 1000;
      sessionStorage.setItem(KEY, String(end));
    }
    setRemaining(end - now);
    const tick = () => {
      const r = end - Date.now();
      setRemaining(r > 0 ? r : 0);
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining == null) return null;

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-3 rounded-full bg-brand-dark2 border border-brand-gold/30 px-4 py-2 text-sm">
      <span className="text-white/70">{label ?? translate("offerEnds")}</span>
      <span className="font-mono tracking-widest text-brand-goldLight">
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </div>
  );
}
