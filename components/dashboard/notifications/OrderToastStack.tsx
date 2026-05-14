"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BellRing, X } from "lucide-react";

export type OrderToastRecord = {
  id: string;
  eyebrow: string;
  headline: string;
  subtitle: string;
  amount?: string;
};

export function OrderToastStack({
  items,
  onDismiss,
}: {
  items: OrderToastRecord[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-[2400] flex max-w-[min(420px,calc(100vw-2.5rem))] flex-col gap-3"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence mode="popLayout">
        {items.map((t) => (
          <motion.article
            key={t.id}
            layout
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              boxShadow: [
                "0 0 0 0 rgba(201,169,98,0)",
                "0 0 0 10px rgba(201,169,98,0.12)",
                "0 0 0 0 rgba(201,169,98,0)",
              ],
            }}
            transition={{
              duration: 0.42,
              ease: [0.16, 1, 0.3, 1],
              boxShadow: { duration: 1.6, repeat: 2, repeatType: "reverse" },
            }}
            exit={{ opacity: 0, x: 28, transition: { duration: 0.22 } }}
            className="pointer-events-auto relative overflow-hidden rounded-2xl border border-[#c9a962]/38 bg-gradient-to-br from-[#2a2a2e]/98 via-[#222225]/96 to-[#1a1a1d]/98 px-[18px] py-4 shadow-[0_28px_90px_-28px_rgba(0,0,0,.88)] backdrop-blur-2xl"
          >
            <span className="pointer-events-none absolute -right-[30%] top-[-80%] h-[240%] w-[55%] rotate-[18deg] bg-gradient-to-bl from-transparent via-transparent to-[#c9a962]/14" />
            <div className="relative flex gap-4">
              <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#c9a962]/28 bg-black/48 text-[#ebe2c9] shadow-inner">
                <BellRing className="size-[19px]" strokeWidth={1.55} aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="font-dashSans text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-200/85">
                  {t.eyebrow}
                </p>
                <p className="mt-2 font-dashDisplay text-[17px] font-semibold tracking-tight text-white">{t.headline}</p>
                <p className="mt-2 text-[12px] leading-snug text-white/62">{t.subtitle}</p>
                {t.amount ? (
                  <p className="mt-3 font-dashSans text-[14px] font-semibold tabular-nums text-[#ebe2c9]">{t.amount}</p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                className="relative -mr-1 -mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/40 text-white/72 motion-safe:hover:border-[#c9a962]/35 motion-safe:hover:text-white"
                onClick={() => onDismiss(t.id)}
              >
                <X className="size-[17px]" strokeWidth={1.6} aria-hidden />
              </button>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}
