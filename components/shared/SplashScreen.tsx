"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const logoSrc = `/logo.png?v=${process.env.NEXT_PUBLIC_LOGO_REVISION ?? "6"}`;

const PARTICLES = [
  { x: -130, y: -65,  size: 5, dur: 8.2,  delay: 0.0 },
  { x:  110, y: -85,  size: 4, dur: 9.5,  delay: 0.6 },
  { x: -150, y:  35,  size: 6, dur: 7.8,  delay: 0.3 },
  { x:  140, y:  55,  size: 3, dur: 10.1, delay: 0.9 },
  { x:  -60, y: 105,  size: 5, dur: 8.7,  delay: 0.2 },
  { x:   75, y:  95,  size: 4, dur: 9.2,  delay: 1.1 },
  { x:  -95, y: -115, size: 3, dur: 8.4,  delay: 0.5 },
  { x:  115, y: -105, size: 6, dur: 7.6,  delay: 0.8 },
];

type Phase = "init" | "show" | "fly" | "done";

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("init");
  const [isMobile, setIsMobile] = useState(false);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") sessionStorage.setItem("splashShown", "1");
    setPhase("done");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("splashShown")) {
      setPhase("done");
      return;
    }
    const mobile =
      window.innerWidth < 768 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setIsMobile(mobile);
    setPhase("show");
    const t1 = setTimeout(() => setPhase("fly"), 2800);
    const t2 = setTimeout(dismiss, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [dismiss]);

  if (phase === "init" || phase === "done") return null;

  // 3 particles on mobile, 8 on desktop
  const visibleParticles = isMobile ? PARTICLES.slice(0, 3) : PARTICLES;

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#28282a]"
        initial={{ opacity: 1 }}
        animate={phase === "fly" ? { opacity: 0 } : { opacity: 1 }}
        transition={phase === "fly" ? { duration: 0.5, ease: "easeInOut" } : { duration: 0 }}
      >
        {/* Ambient gold glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(201,168,76,0.08),transparent_70%)]" aria-hidden />

        {/* Floating particles */}
        {visibleParticles.map((p, i) => (
          <motion.div
            key={i}
            aria-hidden
            className="pointer-events-none absolute rounded-full bg-brand-gold"
            style={{
              width: p.size,
              height: p.size,
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${p.y}px)`,
              willChange: "transform",
            }}
            initial={{ opacity: 0 }}
            animate={
              isMobile
                ? { opacity: 0.25 }
                : { opacity: [0.15, 0.5, 0.2, 0.45, 0.15], y: [0, -18, 8, -12, 0], x: [0, 8, -5, 6, 0] }
            }
            transition={
              isMobile
                ? { duration: 0.4 }
                : { duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }
            }
          />
        ))}

        {/* Logo + tagline */}
        <motion.div
          className="flex flex-col items-center"
          style={{ willChange: "transform" }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={
            phase === "fly"
              ? { scale: 0.25, opacity: 0, y: -260 }
              : { scale: 1, opacity: 1, y: 0 }
          }
          transition={
            phase === "fly"
              ? { duration: 0.55, ease: [0.4, 0, 0.2, 1] }
              : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
          }
        >
          {/* Logo with gold shimmer sweep — skip on mobile */}
          <div className="relative overflow-hidden">
            <Image
              src={logoSrc}
              alt="SIWAKY"
              width={260}
              height={82}
              priority
              unoptimized
              className="object-contain"
            />
            {!isMobile && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-brand-goldLight/55 to-transparent"
                initial={{ x: "-110%" }}
                animate={{ x: "210%" }}
                transition={{ delay: 0.6, duration: 0.65, ease: "easeOut" }}
              />
            )}
          </div>

          {/* Arabic tagline */}
          <motion.p
            className="mt-6 font-display text-2xl text-brand-goldLight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7, ease: "easeOut" }}
          >
            سنّة النبي ﷺ بنكهتك
          </motion.p>
        </motion.div>

        {/* Skip button */}
        <motion.button
          type="button"
          onClick={dismiss}
          className="absolute bottom-8 end-6 text-sm text-white/40 transition-colors hover:text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
        >
          تخطي ←
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
