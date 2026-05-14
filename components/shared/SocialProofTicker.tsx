"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export default function SocialProofTicker() {
  const t = useTranslations("socialTicker");
  const locale = useLocale();
  const entries = (t.raw("entries") as string[]) ?? [];
  const len = entries.length;
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    setIndex(null);
  }, [locale]);

  useEffect(() => {
    if (len === 0) return;
    const initial = setTimeout(() => setIndex(0), 6000);
    const id = setInterval(() => {
      setIndex((i) => (i == null ? 0 : (i + 1) % len));
    }, 9000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [locale, len]);

  if (index == null) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 start-4 z-10 max-w-[80vw] md:bottom-6 md:start-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-brand-dark2/90 border border-brand-gold/20 px-4 py-2 text-sm text-white/80 shadow-gold backdrop-blur"
        >
          <span className="inline-block size-2 rounded-full bg-brand-gold animate-pulseSoft" />
          <span>
            {entries[index] ?? ""} {t("suffix")}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
