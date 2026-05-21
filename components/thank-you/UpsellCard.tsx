"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { type OfferId } from "@/lib/offers";

const UPSELL = {
  "box-1": { price: 199, original: 245, savings: 46 },
  "box-2": { price: 179, original: 245, savings: 66 },
} as const;

const DURATION_S = 10 * 60;

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

interface Props {
  offerId: OfferId | undefined;
}

export default function UpsellCard({ offerId }: Props) {
  const cfg = offerId && offerId in UPSELL ? UPSELL[offerId as keyof typeof UPSELL] : null;
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const router = useRouter();

  const [gone, setGone] = useState(false);
  const [seconds, setSeconds] = useState(DURATION_S);

  useEffect(() => {
    if (gone || !cfg) return;
    const id = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setGone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [gone, cfg]);

  if (!cfg) return null;

  const handleAdd = () => {
    router.push(`/${locale}/product?discount=upsell&price=${cfg.price}`);
  };

  return (
    <AnimatePresence mode="wait">
      {!gone && (
        <motion.div
          key="upsell"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-8 max-w-lg"
        >
          {/* Gold gradient border */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-gold/55 via-brand-gold/20 to-brand-gold/55 p-[1px] shadow-[0_0_48px_-16px_rgba(201,168,76,0.45)]">
            <div className="relative overflow-hidden rounded-2xl bg-[#28282a] px-6 py-7 text-center">
              {/* Ambient glow */}
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(201,168,76,0.09),transparent_62%)]"
                aria-hidden
              />

              {/* Animated badge */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="relative mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/[0.12] px-4 py-1.5 text-sm font-semibold text-yellow-300"
              >
                ⚡ عرض خاص لك الآن فقط
              </motion.div>

              <h3 className="relative font-display text-2xl text-white md:text-3xl">
                أضف علبة إضافية بسعر مخفّض 🎁
              </h3>

              {/* Pricing */}
              <div className="relative mt-5 flex items-center justify-center gap-5">
                <span className="text-lg text-white/40 line-through">{cfg.original} ر.س</span>
                <span className="font-display text-5xl font-bold text-brand-goldLight md:text-6xl">
                  {cfg.price} ر.س
                </span>
              </div>

              {/* Savings */}
              <div className="relative mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-400/[0.1] px-4 py-1.5 text-sm font-semibold text-emerald-300">
                وفّرت {cfg.savings} ر.س 🎉
              </div>

              {/* Countdown */}
              <div className="relative mt-6 flex items-center justify-center gap-3">
                <span className="text-sm text-white/55">ينتهي العرض خلال:</span>
                <motion.span
                  key={seconds <= 60 ? "urgent" : "normal"}
                  animate={seconds <= 60 ? { color: ["#f87171", "#fca5a5", "#f87171"] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="font-mono text-xl font-bold tabular-nums text-brand-goldLight"
                >
                  {fmt(seconds)}
                </motion.span>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleAdd}
                className="btn-primary relative mt-6 w-full justify-center text-base"
              >
                أضف للطلب الآن — {cfg.price} ر.س
              </button>

              <p className="relative mt-3 text-xs text-white/40">
                سيتم تطبيق السعر المخفّض تلقائياً · الدفع عند الاستلام
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
