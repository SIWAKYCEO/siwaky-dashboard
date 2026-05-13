"use client";

import { motion } from "framer-motion";

/** Luxury SVG check — stroke draws over ~1.5s */
export default function PremiumCheckmark() {
  return (
    <motion.div
      className="relative mx-auto flex size-[8.75rem] items-center justify-center"
      initial={{ scale: 0.45, opacity: 0, rotate: -8 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.05 }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-[-28%] rounded-full bg-brand-gold/25 blur-3xl"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.35, 0.55, 0.38],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative flex size-[6.75rem] items-center justify-center rounded-full border-[2.5px] border-brand-gold/90 bg-[radial-gradient(ellipse_at_30%_20%,rgba(240,223,160,0.22),transparent_55%),rgba(40,40,42,0.96)] shadow-[inset_0_1px_0_rgba(240,223,160,0.35),0_0_52px_-8px_rgba(201,168,76,0.75)]"
        initial={{ rotate: -90, scale: 0.92 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 20, delay: 0.12 }}
      >
        <motion.span
          className="pointer-events-none absolute inset-[-3px] rounded-full border border-brand-goldLight/35"
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          style={{
            maskImage: "conic-gradient(from 0deg, transparent 40%, black 50%, transparent 62%)",
            WebkitMaskImage:
              "conic-gradient(from 0deg, transparent 40%, black 50%, transparent 62%)",
          }}
        />

        <svg
          viewBox="0 0 64 64"
          className="relative size-14 text-brand-gold"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ty-check-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F0DFA0" />
              <stop offset="45%" stopColor="#C9A84C" />
              <stop offset="100%" stopColor="#A07830" />
            </linearGradient>
          </defs>
          <motion.path
            d="M18 34 L28 44 L48 22"
            stroke="url(#ty-check-gold)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
              opacity: { delay: 0.18, duration: 0.25 },
            }}
          />
        </svg>
      </motion.div>

      <motion.span
        className="pointer-events-none absolute inset-[-8%] rounded-full border border-brand-gold/25"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: [0, 0.7, 0], scale: [0.92, 1.12, 1.18] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.8, ease: "easeOut" }}
      />
    </motion.div>
  );
}
