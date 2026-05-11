"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const NAMES_AR = [
  "أحمد من الرياض",
  "سارة من جدة",
  "خالد من الدمام",
  "فاطمة من مكة",
  "محمد من المدينة",
  "ريم من الرياض",
  "عبدالله من الطائف",
  "نورة من الأحساء",
  "سعد من بريدة",
  "هند من تبوك",
];

export default function SocialProofTicker() {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const initial = setTimeout(() => setIndex(0), 6000);
    const id = setInterval(() => {
      setIndex((i) => (i == null ? 0 : (i + 1) % NAMES_AR.length));
    }, 9000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, []);

  if (index == null) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 start-4 z-30 max-w-[80vw] md:bottom-6 md:start-6">
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
          <span>{NAMES_AR[index]} طلب للتو</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
