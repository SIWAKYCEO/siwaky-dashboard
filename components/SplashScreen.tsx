"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/* ─── Particle data (seeded for determinism) ────────────────────────────── */
interface Particle {
  id: number; size: number; left: number;
  duration: number; delay: number; drift: number;
}
const PARTICLE_DATA: [number, number, number, number, number][] = [
  [1.8,23,9.2,1.3,-12],[2.4,67,11.5,0.4,18],[1.2,45,8.7,3.1,-25],
  [3.1,12,13.2,0.8,7],[1.6,78,10.4,2.5,-18],[2.9,34,7.8,4.2,22],
  [1.4,56,12.1,1.7,-8],[3.3,89,9.6,0.2,15],[2.1,29,11.8,3.8,-20],
  [1.7,61,8.3,2.1,28],[2.6,8,13.7,0.6,-15],[1.3,72,10.9,4.7,10],
  [3.0,41,7.5,1.9,-28],[2.2,83,12.4,3.3,20],[1.5,17,9.8,0.9,-5],
  [2.8,53,11.2,2.7,25],[1.9,36,8.6,4.4,-22],[3.2,95,10.1,1.1,12],
];
function buildParticles(count: number): Particle[] {
  return PARTICLE_DATA.slice(0, count).map(([size,left,duration,delay,drift], id) =>
    ({ id, size, left, duration, delay, drift }));
}

/* ─── Canvas constellation dots (seeded positions) ──────────────────────── */
interface Dot { x:number; y:number; vx:number; vy:number }
const DOT_SEED: [number,number,number,number][] = [
  [.12,.23,.18,-.15],[.34,.67,-.12,.22],[.56,.45,.25,-.18],[.78,.12,-.20,.15],
  [.23,.89,.15,.20],[.67,.34,-.18,-.12],[.45,.78,.22,.18],[.89,.56,-.15,-.25],
  [.11,.44,.20,.12],[.50,.50,-.22,.20],[.73,.27,.18,-.15],[.27,.73,-.12,.22],
  [.62,.18,.25,.18],[.18,.62,-.20,-.12],[.84,.84,.15,-.20],[.39,.39,-.18,.15],
  [.91,.08,.22,-.22],[.08,.91,-.15,.18],[.55,.75,.20,.15],[.75,.55,-.25,-.18],
];

/* ─── Injected CSS ───────────────────────────────────────────────────────── */
const PARTICLE_CSS = `
.sw-ptcl {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201,168,76,0.9), transparent);
  pointer-events: none;
  animation: sw-float var(--d) var(--dl) linear infinite;
}
@keyframes sw-float {
  0%   { transform: translateY(100vh) translateX(0) scale(0); opacity:0; }
  10%  { opacity:1; }
  90%  { opacity:0.5; }
  100% { transform: translateY(-20vh) translateX(var(--dr)) scale(1); opacity:0; }
}
`;

/* ─── Phase constants ────────────────────────────────────────────────────── */
const T_PHASE1  = 50;
const T_PHASE2  = 800;
const T_SKIP    = 1800;
const T_PHASE3  = 2200;
const T_PHASE4  = 3400;
const T_UNMOUNT = 5100;

export default function SplashScreen() {
  const [show,       setShow]       = useState(false);
  const [exited,     setExited]     = useState(false);
  const [phase,      setPhase]      = useState(0);
  const [skipVis,    setSkipVis]    = useState(false);
  const [logoWidth,  setLogoWidth]  = useState(240);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const dotsRef    = useRef<Dot[]>([]);
  const particlesR = useRef<Particle[]>([]);

  /* ── Hydration / session guard ───────────────────────────────────────── */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || sessionStorage.getItem("sw_splash_v2")) {
      setExited(true);
      return;
    }
    const mobile = window.innerWidth < 768;
    setLogoWidth(mobile ? 200 : 240);
    particlesR.current = buildParticles(mobile ? 8 : 18);
    setShow(true);
  }, []);

  /* ── Phase timer ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!show) return;
    const ts = [
      setTimeout(() => setPhase(1),    T_PHASE1),
      setTimeout(() => setPhase(2),    T_PHASE2),
      setTimeout(() => setSkipVis(true), T_SKIP),
      setTimeout(() => setPhase(3),    T_PHASE3),
      setTimeout(() => setPhase(4),    T_PHASE4),
      setTimeout(() => {
        sessionStorage.setItem("sw_splash_v2", "1");
        setExited(true);
      }, T_UNMOUNT),
    ];
    return () => ts.forEach(clearTimeout);
  }, [show]);

  /* ── Canvas constellation ────────────────────────────────────────────── */
  useEffect(() => {
    if (!show) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    dotsRef.current = DOT_SEED.map(([rx,ry,vx,vy]) => ({
      x: rx * canvas.width,
      y: ry * canvas.height,
      vx: vx * 0.35,
      vy: vy * 0.35,
    }));

    const tick = () => {
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      const dots = dotsRef.current;

      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
      }
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(201,168,76,${0.08 * (1 - dist/180)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(201,168,76,0.08)";
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [show]);

  /* ── Skip handler ────────────────────────────────────────────────────── */
  const handleSkip = () => {
    sessionStorage.setItem("sw_splash_v2", "1");
    setExited(true);
  };

  if (!show || exited) return null;

  const p4 = phase >= 4;
  const ps = particlesR.current;

  return (
    <>
      <style>{PARTICLE_CSS}</style>

      <motion.div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#0a0a0b",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column",
          transform: "translateZ(0)",
          overflow: "hidden",
          pointerEvents: p4 ? "none" : undefined,
        }}
        animate={p4 ? { clipPath: "inset(0 0 100% 0)" } : { clipPath: "inset(0 0 0% 0)" }}
        transition={p4 ? { duration: 0.5, delay: 0.35, ease: "easeInOut" } : { duration: 0 }}
      >
        {/* ── Canvas ─────────────────────────────────────────────────── */}
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />

        {/* ── Particles (CSS only) ────────────────────────────────────── */}
        {ps.map((p) => (
          <div
            key={p.id}
            className="sw-ptcl"
            style={{
              width:  p.size,
              height: p.size,
              left:   `${p.left}%`,
              bottom: 0,
              "--d":  `${p.duration}s`,
              "--dl": `${p.delay}s`,
              "--dr": `${p.drift}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* ── Ambient glow (behind logo) ──────────────────────────────── */}
        <motion.div
          aria-hidden
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 400, height: 400, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
            willChange: "transform, opacity",
          }}
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Phase 1: center pulse dot ───────────────────────────────── */}
        {phase >= 1 && (
          <motion.div
            aria-hidden
            style={{
              position: "absolute", top: "50%", left: "50%",
              width: 3, height: 3, borderRadius: "50%",
              background: "#C9A84C",
              transform: "translate(-50%,-50%)",
              boxShadow: "0 0 8px 3px rgba(201,168,76,0.7)",
              zIndex: 1,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0,1,1.8,1], opacity: [0,1,0.6,1] }}
            transition={{ duration: 0.8, times: [0,0.3,0.6,1] }}
          />
        )}

        {/* ── Phase 1: compass rays (SVG) ─────────────────────────────── */}
        {phase >= 1 && (
          <svg
            aria-hidden
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              overflow: "visible", pointerEvents: "none",
            }}
          >
            {/* Lines from center 50%,50% — use foreignObject trick: draw from 0,0 with transform */}
            <g style={{ transform: "translate(50%, 50%)" }}>
              {([
                [0, -320],
                [277, 160],
                [-277, 160],
              ] as [number, number][]).map(([ex, ey], i) => (
                <motion.line
                  key={i}
                  x1={0} y1={0} x2={ex} y2={ey}
                  stroke="#C9A84C"
                  strokeWidth={0.5}
                  strokeOpacity={0.55}
                  strokeDasharray="320"
                  initial={{ strokeDashoffset: 320 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: "linear" }}
                />
              ))}
            </g>
          </svg>
        )}

        {/* ── Phase 2: radial light burst ─────────────────────────────── */}
        {phase >= 2 && (
          <motion.div
            aria-hidden
            style={{
              position: "absolute", top: "50%", left: "50%",
              borderRadius: "50%",
              background: "radial-gradient(circle, #FFF8E1 0%, #C9A84C 20%, transparent 70%)",
              transform: "translate(-50%,-50%)",
              pointerEvents: "none",
            }}
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{ width: 300, height: 300, opacity: [0, 1, 0.25, 0] }}
            transition={{ duration: 1.0, times: [0, 0.2, 0.6, 1], ease: "easeOut" }}
          />
        )}

        {/* ── Phase 2: logo + gold line ───────────────────────────────── */}
        {phase >= 2 && (
          <motion.div
            layoutId="siwaky-logo"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              position: "relative", zIndex: 2,
              willChange: "transform, filter, opacity",
            }}
            initial={{ scale: 0.4, filter: "blur(20px)", opacity: 0, y: 0 }}
            animate={p4 ? {
              scale: 0.45,
              y: "-45vh",
              opacity: 0,
              filter: "blur(6px)",
            } : {
              scale: 1,
              filter: "blur(0px)",
              opacity: 1,
              y: 0,
            }}
            transition={p4 ? {
              duration: 0.7,
              ease: [0.4, 0, 0.2, 1],
            } : {
              duration: 0.9,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Image
              src="/logo.png"
              alt="SIWAKY"
              width={512}
              height={160}
              priority
              unoptimized
              style={{
                width:  logoWidth,
                height: "auto",
                display: "block",
                filter: "drop-shadow(0 0 30px rgba(201,168,76,0.6)) brightness(1.05)",
              }}
            />
            {/* Horizontal gold line */}
            <motion.div
              style={{
                width: 280, height: 1, marginTop: 18,
                background: "linear-gradient(90deg, transparent 0%, #C9A84C 50%, transparent 100%)",
                transformOrigin: "left center",
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.16,1,0.3,1] }}
            />
          </motion.div>
        )}

        {/* ── Phase 3: text block ─────────────────────────────────────── */}
        {phase >= 3 && (
          <div
            style={{
              position: "absolute", bottom: "18%",
              left: "50%", transform: "translateX(-50%)",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 10, zIndex: 3, textAlign: "center",
            }}
          >
            {/* Diamond ornament */}
            <motion.div
              aria-hidden
              style={{ fontSize: 8, color: "#C9A84C", lineHeight: 1 }}
              initial={{ opacity: 0 }}
              animate={p4 ? { opacity: 0, y: -10 } : { opacity: [0,1,0.7,1], scale: [1,1.4,1] }}
              transition={p4 ? { duration: 0.25 } : {
                duration: 0.4,
                repeat: Infinity,
                repeatDelay: 1.8,
                ease: "easeInOut",
                times: [0, 0.4, 1],
              }}
            >◆</motion.div>

            {/* S I W A K Y */}
            <motion.div
              style={{
                display: "flex",
                fontSize: 11,
                letterSpacing: 14,
                color: "#C9A84C",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 300,
                paddingRight: 14, /* compensate trailing letter-spacing */
              }}
              animate={p4 ? { opacity: 0, y: -10 } : {}}
              transition={p4 ? { duration: 0.25, delay: 0.08 } : {}}
            >
              {"SIWAKY".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>

            {/* Arabic tagline */}
            <motion.div
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.9)",
                fontFamily: "var(--font-naskh), 'Noto Naskh Arabic', serif",
                direction: "rtl",
                display: "flex", flexWrap: "wrap", justifyContent: "center",
                gap: "0 6px",
              }}
              animate={p4 ? { opacity: 0, y: -10 } : {}}
              transition={p4 ? { duration: 0.25, delay: 0.16 } : {}}
            >
              {"حيث تلتقي السنّة بالفخامة".split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  transition={{ delay: 0.25 + i * 0.12, duration: 0.4 }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>

            {/* Subtitle */}
            <motion.div
              style={{
                fontSize: 11,
                color: "rgba(201,168,76,0.55)",
                letterSpacing: 3,
                fontFamily: "var(--font-naskh), 'Noto Naskh Arabic', serif",
                direction: "rtl",
              }}
              initial={{ opacity: 0 }}
              animate={p4 ? { opacity: 0, y: -10 } : { opacity: 1 }}
              transition={p4 ? { duration: 0.25, delay: 0.24 } : { delay: 0.65, duration: 0.5 }}
            >
              طهارة · أصالة · رقي
            </motion.div>
          </div>
        )}

        {/* ── Skip button ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {skipVis && !p4 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={handleSkip}
              style={{
                position: "fixed", bottom: 32, right: 32,
                border: "1px solid rgba(201,168,76,0.3)",
                padding: "6px 16px", borderRadius: 20,
                background: "transparent", cursor: "pointer",
                fontSize: 11, color: "rgba(201,168,76,0.5)",
                letterSpacing: 2,
                fontFamily: "var(--font-naskh), 'Noto Naskh Arabic', serif",
                transition: "border-color 0.2s, color 0.2s, box-shadow 0.2s",
                zIndex: 10000,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#C9A84C";
                e.currentTarget.style.color = "#C9A84C";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(201,168,76,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                e.currentTarget.style.color = "rgba(201,168,76,0.5)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              تخطي
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
