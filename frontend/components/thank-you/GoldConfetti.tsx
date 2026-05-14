"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

/** Subtle falling gold particles — optimized count, no layout thrash */
export default function GoldConfetti() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 13) % 100}%`,
        w: (i % 4) + 2,
        h: (i % 3) + 3,
        dur: 9 + (i % 7),
        delay: (i % 10) * 0.35,
        drift: ((i % 5) - 2) * 18,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[min(52vh,520px)] overflow-hidden" aria-hidden>
      {flakes.map((f) => (
        <motion.span
          key={f.id}
          className="absolute rounded-[1px] bg-brand-gold shadow-[0_0_10px_rgba(201,168,76,0.35)] opacity-[0.35]"
          style={{
            left: f.left,
            top: "-12px",
            width: f.w,
            height: f.h,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: ["0vh", "115vh"],
            x: [0, f.drift, -f.drift * 0.4],
            opacity: [0, 0.55, 0.15, 0],
            rotate: [0, f.drift * 0.8],
          }}
          transition={{
            duration: f.dur,
            repeat: Infinity,
            delay: f.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
