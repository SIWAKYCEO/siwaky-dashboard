"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const logoSrc = `/logo.png?v=${process.env.NEXT_PUBLIC_LOGO_REVISION ?? "6"}`;

const GOLD = "#C9A84C";
const GOLD_LIGHT = "#F0DFA0";
const BG = "#0e0e10";

const PARTICLES = [
  { id: 0,  size: 2, left: "8%",  delay: 0.0, dur: 6.2, drift: "12px"  },
  { id: 1,  size: 1, left: "18%", delay: 0.8, dur: 7.5, drift: "-8px"  },
  { id: 2,  size: 3, left: "28%", delay: 0.3, dur: 5.8, drift: "15px"  },
  { id: 3,  size: 2, left: "38%", delay: 1.2, dur: 8.1, drift: "-12px" },
  { id: 4,  size: 1, left: "48%", delay: 0.5, dur: 6.7, drift: "8px"   },
  { id: 5,  size: 4, left: "58%", delay: 1.5, dur: 7.2, drift: "-20px" },
  { id: 6,  size: 2, left: "68%", delay: 0.2, dur: 5.4, drift: "18px"  },
  { id: 7,  size: 3, left: "78%", delay: 1.0, dur: 8.8, drift: "-10px" },
  { id: 8,  size: 1, left: "12%", delay: 1.8, dur: 6.5, drift: "22px"  },
  { id: 9,  size: 2, left: "32%", delay: 0.7, dur: 7.0, drift: "-16px" },
  { id: 10, size: 3, left: "52%", delay: 2.0, dur: 5.6, drift: "10px"  },
  { id: 11, size: 1, left: "72%", delay: 0.4, dur: 8.3, drift: "-24px" },
  { id: 12, size: 2, left: "22%", delay: 1.4, dur: 6.9, drift: "14px"  },
  { id: 13, size: 4, left: "62%", delay: 0.9, dur: 7.8, drift: "-18px" },
  { id: 14, size: 2, left: "42%", delay: 2.2, dur: 6.1, drift: "20px"  },
];

const PARTICLE_CSS = `
@keyframes splashPx {
  0%   { transform: translateY(0)       translateX(0);             opacity: 0;   }
  8%   {                                                             opacity: 0.5; }
  85%  {                                                             opacity: 0.2; }
  100% { transform: translateY(-110vh)  translateX(var(--pdrift));  opacity: 0;   }
}
`;

const SVG_LINES = [
  { x2: 0,    y2: 500, strokeW: 0.5, opa: 0.38, delay: 0.10 },
  { x2: 1000, y2: 500, strokeW: 0.5, opa: 0.38, delay: 0.10 },
  { x2: 200,  y2: 200, strokeW: 0.4, opa: 0.20, delay: 0.35 },
  { x2: 800,  y2: 800, strokeW: 0.4, opa: 0.20, delay: 0.35 },
  { x2: 800,  y2: 200, strokeW: 0.4, opa: 0.20, delay: 0.55 },
  { x2: 200,  y2: 800, strokeW: 0.4, opa: 0.20, delay: 0.55 },
];

const TAGLINE_WORDS = "حيث تلتقي السنّة بالفخامة".split(" ");
const LOGO_CHARS    = "SIWAKY".split("");

// Luxury easing
const SILK  = [0.22, 1, 0.36, 1] as const;
const WIPE  = [0.76, 0, 0.24, 1] as const;
const SWOOP = [0.40, 0, 0.20, 1] as const;

type Phase = "init" | "active" | "exit" | "done";

export default function SplashScreen() {
  const [phase, setPhase]       = useState<Phase>("init");
  const [exitFast, setExitFast] = useState(false);

  const dismiss = useCallback((fast = false) => {
    sessionStorage.setItem("splashShown", "1");
    setExitFast(fast);
    setPhase("exit");
    setTimeout(() => setPhase("done"), fast ? 380 : 1100);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("splashShown", "1");
      return;
    }
    if (sessionStorage.getItem("splashShown")) return;
    setPhase("active");
    const t = setTimeout(() => dismiss(false), 4500);
    return () => clearTimeout(t);
  }, [dismiss]);

  if (phase === "init" || phase === "done") return null;

  const isExit   = phase === "exit";
  const exitDur  = exitFast ? 0.28 : 0.75;
  const exitDelay = exitFast ? 0   : 0.22;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ pointerEvents: isExit ? "none" : "all" }}
    >
      {/* CSS particle keyframes */}
      <style dangerouslySetInnerHTML={{ __html: PARTICLE_CSS }} />

      {/* ── BACKGROUND: luxury upward wipe ── */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: BG }}
        initial={{ y: "0%" }}
        animate={{ y: isExit ? "-100%" : "0%" }}
        transition={{ duration: exitDur, delay: exitDelay, ease: WIPE }}
      />

      {/* ── PARTICLES (CSS-driven, performance-optimised) ── */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            bottom: 0,
            backgroundColor: GOLD,
            opacity: 0,
            ["--pdrift" as string]: p.drift,
            animation: `splashPx ${p.dur}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* ── RADIAL CENTRE GLOW ── */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            `radial-gradient(ellipse 52% 36% at 50% 50%,` +
            ` rgba(201,168,76,0.13) 0%, transparent 70%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExit ? 0 : 1 }}
        transition={{
          delay:    isExit ? 0    : 0.4,
          duration: isExit ? 0.18 : 1.2,
        }}
      />

      {/* ── GEOMETRIC SVG LINES ── */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width="100%" height="100%"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        {SVG_LINES.map((l, i) => (
          <motion.line
            key={i}
            x1={500} y1={500}
            x2={l.x2} y2={l.y2}
            stroke={GOLD}
            strokeWidth={l.strokeW}
            strokeOpacity={l.opa}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: isExit ? 0 : 1 }}
            transition={
              isExit
                ? { duration: 0.22 }
                : { delay: l.delay, duration: 0.78, ease: "easeOut" }
            }
          />
        ))}
      </svg>

      {/* ── CENTRE CONTENT ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-7">

        {/* ── LOGO GROUP ── */}
        <div className="relative flex items-center justify-center">

          {/* Light burst */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              width: 340, height: 340,
              borderRadius: "50%",
              background:
                `radial-gradient(circle,` +
                ` rgba(201,168,76,0.40) 0%,` +
                ` rgba(201,168,76,0.08) 45%,` +
                ` transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isExit
                ? { scale: 0.3, opacity: 0 }
                : { scale: [0, 2.7, 1.25], opacity: [0, 0.88, 0.18] }
            }
            transition={{ delay: 1.0, duration: 1.1, ease: SILK }}
          />

          {/* Logo: reveal → fly to header */}
          <motion.div
            style={{ willChange: "transform, opacity" }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={
              isExit
                ? { scale: 0.55, opacity: 0, y: -300 }
                : { scale: 1,    opacity: 1, y: 0     }
            }
            transition={
              isExit
                ? { duration: exitDur * 0.9, ease: SWOOP }
                : { delay: 1.0, duration: 0.95, ease: SILK }
            }
          >
            {/* Subtle float */}
            <motion.div
              animate={isExit ? {} : { y: [0, -3, 0] }}
              transition={{
                duration: 3.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.3,
                repeatDelay: 0.4,
              }}
            >
              {/* Soft pulsing glow ring */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute"
                style={{ inset: -18, borderRadius: 14 }}
                animate={
                  isExit ? {} : {
                    boxShadow: [
                      "0 0 18px rgba(201,168,76,0.12)",
                      "0 0 52px rgba(201,168,76,0.38)",
                      "0 0 18px rgba(201,168,76,0.12)",
                    ],
                  }
                }
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2.0,
                }}
              />

              {/* Logo image + shimmer sweep */}
              <div className="relative overflow-hidden">
                <Image
                  src={logoSrc}
                  alt="SIWAKY"
                  width={280}
                  height={88}
                  priority
                  unoptimized
                  className="relative z-10 object-contain"
                  style={{
                    filter: "drop-shadow(0 0 20px rgba(201,168,76,0.25))",
                  }}
                />
                {/* Shimmer sweep L→R */}
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-20"
                  style={{
                    background:
                      `linear-gradient(108deg,` +
                      ` transparent 15%,` +
                      ` rgba(240,223,160,0.72) 50%,` +
                      ` transparent 85%)`,
                  }}
                  initial={{ x: "-120%" }}
                  animate={{ x: "220%" }}
                  transition={{ delay: 1.72, duration: 0.82, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Horizontal decorative line behind logo */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              width: "88vw",
              height: 1,
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              background:
                `linear-gradient(90deg,` +
                ` transparent 0%,` +
                ` rgba(201,168,76,0.28) 22%,` +
                ` rgba(201,168,76,0.28) 78%,` +
                ` transparent 100%)`,
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={
              isExit
                ? { opacity: 0 }
                : { scaleX: 1, opacity: 1 }
            }
            transition={
              isExit
                ? { duration: 0.18 }
                : { delay: 1.92, duration: 1.0, ease: "easeOut" }
            }
          />
        </div>

        {/* Diamond ornament */}
        <motion.div
          aria-hidden
          style={{
            fontSize: 9,
            letterSpacing: 14,
            color: GOLD,
            opacity: 0.75,
            userSelect: "none",
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={
            isExit
              ? { opacity: 0, scale: 0.4 }
              : { opacity: 0.75, scale: 1 }
          }
          transition={
            isExit
              ? { duration: 0.18 }
              : { delay: 2.42, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }
          }
        >
          ◆◇◆
        </motion.div>

        {/* ── TEXT BLOCK ── */}
        <motion.div
          className="flex flex-col items-center text-center gap-3"
          animate={isExit ? { opacity: 0, y: -14 } : { opacity: 1, y: 0 }}
          transition={isExit ? { duration: 0.2 } : { duration: 0 }}
        >
          {/* Line 1 — S I W A K Y spaced caps */}
          <div className="flex" style={{ letterSpacing: 10 }}>
            {LOGO_CHARS.map((ch, i) => (
              <motion.span
                key={i}
                style={{
                  display: "inline-block",
                  fontSize: 11,
                  color: GOLD_LIGHT,
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontWeight: 300,
                  textTransform: "uppercase",
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.52 + i * 0.04, duration: 0.44, ease: "easeOut" }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          {/* Line 2 — Arabic tagline, word by word */}
          <div
            dir="rtl"
            className="flex flex-wrap justify-center gap-2"
          >
            {TAGLINE_WORDS.map((word, i) => (
              <motion.span
                key={i}
                style={{
                  fontFamily: "var(--font-scheherazade), serif",
                  fontSize: "clamp(1.05rem, 3.8vw, 1.35rem)",
                  color: GOLD_LIGHT,
                  fontWeight: 400,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.82 + i * 0.13, duration: 0.52, ease: "easeOut" }}
              >
                {word}
              </motion.span>
            ))}
          </div>

          {/* Line 3 — subtitle */}
          <motion.p
            dir="rtl"
            style={{
              fontFamily: "var(--font-naskh), serif",
              fontSize: "clamp(0.62rem, 1.8vw, 0.72rem)",
              color: "rgba(201,168,76,0.52)",
              letterSpacing: "0.06em",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.32, duration: 0.72, ease: "easeOut" }}
          >
            تجربة فريدة من نوعها · طهارة · أصالة · رقي
          </motion.p>
        </motion.div>
      </div>

      {/* ── GOLD SWEEP LINE (exit only) ── */}
      {isExit && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0"
          style={{
            height: 1,
            top: "50%",
            background:
              `linear-gradient(90deg,` +
              ` transparent,` +
              ` ${GOLD_LIGHT} 38%,` +
              ` ${GOLD_LIGHT} 62%,` +
              ` transparent)`,
          }}
          initial={{ scaleX: 0, opacity: 0.9 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: exitDur * 0.85, ease: "easeInOut" }}
        />
      )}

      {/* ── SKIP BUTTON ── */}
      <motion.button
        type="button"
        onClick={() => dismiss(true)}
        className="absolute bottom-8 end-6 z-50"
        style={{
          fontSize: "0.78rem",
          color:   "rgba(201,168,76,0.62)",
          border:  "1px solid rgba(201,168,76,0.28)",
          padding: "0.28rem 0.75rem",
          borderRadius: 2,
          background: "transparent",
          cursor: "pointer",
          letterSpacing: "0.06em",
          fontFamily: "var(--font-naskh), serif",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExit ? 0 : 1 }}
        transition={{ delay: isExit ? 0 : 1.5, duration: 0.4 }}
      >
        تخطي
      </motion.button>
    </div>
  );
}
