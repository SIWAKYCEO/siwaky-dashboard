"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/* ─── Mobile detection (module-level, safe in "use client") ─────────────── */
const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
const DUR = isMobile ? 0.8 : 1; // 20% faster on mobile

/* ─── Particle types ─────────────────────────────────────────────────────── */
type PType = "a" | "b" | "c";
interface Particle {
  id: number; type: PType; size: number;
  left: number; top?: number;
  duration: number; delay: number; drift: number;
}

const PA: [number,number,number,number,number][] = [
  [1.0,8,5.2,0.5,-8],[1.2,19,6.8,1.2,12],[0.8,31,5.5,2.8,-15],
  [1.1,52,7.2,0.3,8],[1.0,64,6.0,3.5,-20],[1.3,76,5.8,1.7,15],
  [0.9,88,7.5,4.1,-10],[1.2,43,6.3,2.2,22],[1.0,25,5.9,0.9,-5],
  [1.1,71,6.6,3.8,18],
];
const PB: [number,number,number,number,number][] = [
  [3.2,15,13.5,0.7,-25],[3.8,37,15.2,2.4,20],[3.0,58,12.8,4.6,-18],
  [4.0,79,14.7,1.3,28],[3.5,91,13.2,3.2,-22],[3.2,6,15.8,0.4,15],
  [3.7,46,14.3,2.9,-30],[3.4,62,12.5,4.3,25],[3.9,83,15.5,1.8,-12],
  [3.1,28,13.0,3.7,20],
];
const PC: [number,number,number,number,number,number][] = [
  [2.5,12,3.8,0.5,0,22],[2.0,35,4.2,2.1,0,68],
  [2.8,65,3.5,4.0,0,35],[2.2,82,4.8,1.8,0,55],
  [3.0,50,3.2,3.5,0,15],
];

function buildParticles(): Particle[] {
  if (isMobile) {
    // 6 particles on mobile — type A only, no glow orbs or star bursts
    return PA.slice(0,3).map(([size,left,duration,delay,drift],i) =>
      ({ id:i, type:"a" as PType, size, left, duration:duration*DUR, delay, drift }))
      .concat(PB.slice(0,3).map(([size,left,duration,delay,drift],i) =>
      ({ id:10+i, type:"b" as PType, size, left, duration:duration*DUR, delay, drift })));
  }
  const out: Particle[] = [];
  PA.forEach(([size,left,duration,delay,drift],i) =>
    out.push({ id:i, type:"a", size, left, duration, delay, drift }));
  PB.forEach(([size,left,duration,delay,drift],i) =>
    out.push({ id:10+i, type:"b", size, left, duration, delay, drift }));
  PC.forEach(([size,left,duration,delay,drift,top],i) =>
    out.push({ id:20+i, type:"c", size, left, duration, delay, drift, top }));
  return out;
}

/* ─── Canvas constellation ───────────────────────────────────────────────── */
interface Dot { x:number; y:number; vx:number; vy:number }
const DOT_SEED:[number,number,number,number][] = [
  [.12,.23,.18,-.15],[.34,.67,-.12,.22],[.56,.45,.25,-.18],[.78,.12,-.20,.15],
  [.23,.89,.15,.20],[.67,.34,-.18,-.12],[.45,.78,.22,.18],[.89,.56,-.15,-.25],
  [.11,.44,.20,.12],[.50,.50,-.22,.20],[.73,.27,.18,-.15],[.27,.73,-.12,.22],
  [.62,.18,.25,.18],[.18,.62,-.20,-.12],[.84,.84,.15,-.20],[.39,.39,-.18,.15],
  [.91,.08,.22,-.22],[.08,.91,-.15,.18],[.55,.75,.20,.15],[.75,.55,-.25,-.18],
];

/* ─── Phase timings ──────────────────────────────────────────────────────── */
// Mobile total: ~4.2s. Desktop: ~5s.
const T = {
  p1:   isMobile ? 40   : 50,
  p2:   isMobile ? 650  : 800,
  skip: isMobile ? 1300 : 1800,
  p3:   isMobile ? 1700 : 2200,
  p4:   isMobile ? 2700 : 3800,   // text fades
  p5:   isMobile ? 3000 : 4000,   // logo exits
  p6:   isMobile ? 9999 : 4100,   // lens flare — disabled on mobile (9999 = never)
  p7:   isMobile ? 3150 : 4200,   // exit wipe / fade
  out:  isMobile ? 4200 : 5000,
} as const;

/* ─── Injected CSS ───────────────────────────────────────────────────────── */
const CSS = `
.sw-pa{position:absolute;border-radius:50%;background:#C9A84C;
  box-shadow:0 0 3px 1px rgba(201,168,76,0.8);pointer-events:none;
  animation:sw-fa var(--d) var(--dl) linear infinite}
@keyframes sw-fa{
  0%  {transform:translateY(100vh) translateX(0) scale(0);opacity:0}
  8%  {opacity:1}
  92% {opacity:.7}
  100%{transform:translateY(-15vh) translateX(var(--dr)) scale(1);opacity:0}}

.sw-pb{position:absolute;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(201,168,76,.85) 0%,rgba(201,168,76,.2) 50%,transparent 70%);
  animation:sw-fb var(--d) var(--dl) ease-in-out infinite}
@keyframes sw-fb{
  0%  {transform:translateY(90vh) translateX(0) scale(.4);opacity:0}
  12% {opacity:.6}
  88% {opacity:.35}
  100%{transform:translateY(-10vh) translateX(var(--dr)) scale(1.3);opacity:0}}

.sw-pc{position:absolute;border-radius:50%;pointer-events:none;
  background:rgba(255,240,150,.95);
  box-shadow:0 0 6px 3px rgba(255,240,150,.5);
  animation:sw-fc var(--d) var(--dl) ease-in-out infinite}
@keyframes sw-fc{
  0%  {transform:scale(.1);opacity:0}
  25% {transform:scale(2.0);opacity:1}
  55% {transform:scale(.9);opacity:.5}
  75% {transform:scale(1.4);opacity:.25}
  100%{transform:scale(.1);opacity:0}}

${isMobile
  /* Mobile: static single drop-shadow, no animation on filter */
  ? `.sw-logo-img{filter:drop-shadow(0 0 25px rgba(201,168,76,0.6));}`
  /* Desktop: triple-layer breathing glow */
  : `.sw-logo-img{will-change:filter;animation:sw-glow 2.5s ease-in-out infinite}
@keyframes sw-glow{
  0%,100%{filter:drop-shadow(0 0 24px rgba(255,240,150,.54)) drop-shadow(0 0 48px rgba(201,168,76,.36)) drop-shadow(0 0 96px rgba(201,168,76,.18)) brightness(1.02)}
  50%{filter:drop-shadow(0 0 40px rgba(255,240,150,.9)) drop-shadow(0 0 80px rgba(201,168,76,.6)) drop-shadow(0 0 160px rgba(201,168,76,.3)) brightness(1.06)}}`
}

.sw-tagline{animation:sw-tglow .6s 1.0s ease-in-out both}
@keyframes sw-tglow{
  0%  {text-shadow:0 0 30px rgba(201,168,76,.4)}
  50% {text-shadow:0 0 40px rgba(255,240,150,1),0 0 80px rgba(201,168,76,.7),0 0 120px rgba(201,168,76,.4);color:rgba(255,240,150,1)}
  100%{text-shadow:0 0 30px rgba(201,168,76,.4)}}
`;

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function SplashScreen() {
  const [show,      setShow]      = useState(false);
  const [exited,    setExited]    = useState(false);
  const [phase,     setPhase]     = useState(0);
  const [logoGone,  setLogoGone]  = useState(false);
  const [skipVis,   setSkipVis]   = useState(false);
  const [logoWidth, setLogoWidth] = useState(320);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const dotsRef   = useRef<Dot[]>([]);
  const psRef     = useRef<Particle[]>([]);

  /* ── session + prefers-reduced-motion guard ── */
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      sessionStorage.getItem("sw_splash_v2")
    ) { setExited(true); return; }
    setLogoWidth(isMobile ? 260 : 320);
    psRef.current = buildParticles();
    setShow(true);
  }, []);

  /* ── phase timers ── */
  useEffect(() => {
    if (!show) return;
    const ts = [
      setTimeout(() => setPhase(1),       T.p1),
      setTimeout(() => setPhase(2),       T.p2),
      setTimeout(() => setSkipVis(true),  T.skip),
      setTimeout(() => setPhase(3),       T.p3),
      setTimeout(() => setPhase(4),       T.p4),
      setTimeout(() => { setPhase(5); setLogoGone(true); }, T.p5),
      setTimeout(() => setPhase(6),       T.p6),
      setTimeout(() => setPhase(7),       T.p7),
      setTimeout(() => {
        sessionStorage.setItem("sw_splash_v2","1");
        setExited(true);
      }, T.out),
    ];
    return () => ts.forEach(clearTimeout);
  }, [show]);

  /* ── canvas constellation — desktop only ── */
  useEffect(() => {
    if (!show || isMobile) return;
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
      x: rx*canvas.width, y: ry*canvas.height,
      vx: vx*.35, vy: vy*.35,
    }));

    const tick = () => {
      const { width:w, height:h } = canvas;
      ctx.clearRect(0,0,w,h);
      const dots = dotsRef.current;
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x<0||d.x>w) d.vx*=-1;
        if (d.y<0||d.y>h) d.vy*=-1;
      }
      for (let i=0;i<dots.length;i++) {
        for (let j=i+1;j<dots.length;j++) {
          const dx=dots[i].x-dots[j].x, dy=dots[i].y-dots[j].y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if (dist<180) {
            ctx.beginPath(); ctx.moveTo(dots[i].x,dots[i].y); ctx.lineTo(dots[j].x,dots[j].y);
            ctx.strokeStyle=`rgba(201,168,76,${.08*(1-dist/180)})`; ctx.lineWidth=.5; ctx.stroke();
          }
        }
      }
      for (const d of dots) {
        ctx.beginPath(); ctx.arc(d.x,d.y,1.5,0,Math.PI*2);
        ctx.fillStyle="rgba(201,168,76,0.08)"; ctx.fill();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize",resize); };
  }, [show]);

  if (!show || exited) return null;

  const textExit = phase >= 4;
  const logoExit = phase >= 5;
  const wipe     = phase >= 7;
  const ps       = psRef.current;
  const halfLogo = logoWidth / 2 + 16;

  const exitText = { opacity: 0, y: -15 };
  const exitTxt  = (delay = 0) => ({ duration: 0.24 * DUR, delay });

  // Container exit: opacity fade on mobile, clip-path wipe on desktop
  const containerAnim = wipe
    ? (isMobile ? { opacity: 0 }                    : { clipPath: "inset(0 0 100% 0)" })
    : (isMobile ? {}                                 : { clipPath: "inset(0 0 0% 0)"   });
  const containerTrans = wipe
    ? { duration: isMobile ? 0.3 : 0.4, ease: "easeInOut" as const }
    : { duration: 0 };

  return (
    <>
      <style>{CSS}</style>

      {/* ── Logo — outside container so layoutId fly-to-header is unclipped ── */}
      <div style={{
        position:"fixed", inset:0,
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:10000, pointerEvents:"none",
      }}>
        <AnimatePresence>
          {phase >= 2 && !logoGone && (
            <motion.div
              key="splash-logo"
              layoutId="siwaky-logo"
              style={{ willChange:"transform, opacity" }}
              initial={isMobile
                ? { scale:0.6, opacity:0 }
                : { scale:0.4, filter:"blur(20px)", opacity:0 }}
              animate={isMobile
                ? { scale:1, opacity:1 }
                : { scale:1, filter:"blur(0px)", opacity:1 }}
              transition={{
                duration: 0.72 * DUR,
                ease: [.16,1,.3,1] as const,
                layout: { duration: 0.8, ease: [.4,0,.2,1] as const },
              }}
            >
              <Image
                src="/logo.png"
                alt="SIWAKY"
                width={512}
                height={160}
                priority
                unoptimized
                className="sw-logo-img"
                style={{ width:logoWidth, height:"auto", display:"block" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        style={{
          position:"fixed", inset:0, zIndex:9998,
          background:"#070708",
          display:"flex", alignItems:"center", justifyContent:"center",
          flexDirection:"column",
          transform:"translateZ(0)",
          WebkitTransform:"translateZ(0)",
          overflow:"hidden",
          pointerEvents: phase>=4 ? "none" : undefined,
        }}
        animate={containerAnim}
        transition={containerTrans}
      >
        {/* ── Canvas — desktop only (CPU-heavy on mobile) ── */}
        {!isMobile && (
          <canvas ref={canvasRef} style={{position:"absolute",inset:0,pointerEvents:"none"}} />
        )}

        {/* ── Grain — desktop only (feTurbulence is slow on Safari) ── */}
        {!isMobile && (
          <svg aria-hidden style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.03,pointerEvents:"none"}}>
            <filter id="sw-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
              <feColorMatrix type="saturate" values="0"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#sw-noise)"/>
          </svg>
        )}

        {/* ── Vignette ── */}
        <div aria-hidden style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.72) 100%)",
        }}/>

        {/* ── Particles (contain:layout paint for compositor isolation) ── */}
        <div
          aria-hidden
          style={{
            position:"absolute", inset:0, pointerEvents:"none",
            contain:"layout paint",
          } as React.CSSProperties}
        >
          {ps.map((p) => (
            <div
              key={p.id}
              className={`sw-p${p.type}`}
              style={{
                width: p.size, height: p.size,
                left: `${p.left}%`,
                ...(p.type==="c" ? {top:`${p.top}%`} : {bottom:0}),
                "--d":  `${p.duration}s`,
                "--dl": `${p.delay}s`,
                "--dr": `${p.drift}px`,
              } as React.CSSProperties & { [key: string]: string | number }}
            />
          ))}
        </div>

        {/* ── Phase 1: center gold pixel ── */}
        {phase>=1 && (
          <motion.div aria-hidden
            style={{
              position:"absolute", top:"50%", left:"50%",
              width:3, height:3, borderRadius:"50%",
              background:"#FFF8E1",
              transform:"translate(-50%,-50%)",
              boxShadow:"0 0 12px 5px rgba(255,240,150,.85)",
              zIndex:1,
            }}
            initial={{scale:0, opacity:0}}
            animate={{scale:[0,1,2.2,1], opacity:[0,1,.5,1]}}
            transition={{duration:.64*DUR, times:[0,.25,.6,1]}}
          />
        )}

        {/* ── Phase 2: radial light burst ── */}
        {phase>=2 && (
          <motion.div aria-hidden
            style={{
              position:"absolute", top:"50%", left:"50%",
              borderRadius:"50%",
              background:"radial-gradient(circle, rgba(255,248,225,.95) 0%, rgba(201,168,76,.6) 18%, rgba(201,168,76,.1) 55%, transparent 75%)",
              transform:"translate(-50%,-50%)",
              pointerEvents:"none",
            }}
            initial={{width:0, height:0, opacity:0}}
            animate={{width:420, height:420, opacity:[0,1,.15,0]}}
            transition={{duration:.92*DUR, times:[0,.16,.65,1], ease:"easeOut"}}
          />
        )}

        {/* ── Phase 2: elliptical ambient glow behind logo ── */}
        {phase>=2 && (
          <motion.div aria-hidden
            style={{
              position:"absolute", top:"50%", left:"50%",
              transform:"translate(-50%,-50%)",
              width:500, height:200, borderRadius:"50%",
              background:"radial-gradient(ellipse at center, rgba(201,168,76,.15) 0%, transparent 70%)",
              pointerEvents:"none",
            }}
            initial={{opacity:0, scale:.5}}
            animate={{opacity:1, scale:1}}
            transition={{duration:.8*DUR, ease:"easeOut"}}
          />
        )}

        {/* ── Phase 2: horizontal gold lines ── */}
        {phase>=2 && (
          <>
            <motion.div aria-hidden
              style={{
                position:"absolute", top:"50%", right:"50%",
                height:"0.5px",
                background:"linear-gradient(to left, #C9A84C 0%, rgba(201,168,76,.4) 60%, transparent 100%)",
                transformOrigin:"right center",
                marginRight: halfLogo,
                pointerEvents:"none",
              }}
              initial={{width:0}}
              animate={logoExit ? {opacity:0} : {width:"45vw"}}
              transition={logoExit ? {duration:.2} : {duration:.6*DUR, delay:.24*DUR, ease:[.16,1,.3,1]}}
            />
            <motion.div aria-hidden
              style={{
                position:"absolute", top:"50%", left:"50%",
                height:"0.5px",
                background:"linear-gradient(to right, #C9A84C 0%, rgba(201,168,76,.4) 60%, transparent 100%)",
                transformOrigin:"left center",
                marginLeft: halfLogo,
                pointerEvents:"none",
              }}
              initial={{width:0}}
              animate={logoExit ? {opacity:0} : {width:"45vw"}}
              transition={logoExit ? {duration:.2} : {duration:.6*DUR, delay:.24*DUR, ease:[.16,1,.3,1]}}
            />
          </>
        )}

        {/* ── Phase 3: text block ── */}
        {phase>=3 && (
          <div style={{
            position:"absolute", bottom:"15%",
            left:"50%", transform:"translateX(-50%)",
            display:"flex", flexDirection:"column", alignItems:"center",
            gap:40, zIndex:3, textAlign:"center", whiteSpace:"nowrap",
          }}>
            <motion.div aria-hidden
              style={{fontSize:8, color:"#C9A84C", lineHeight:1}}
              initial={{opacity:0}}
              animate={textExit ? exitText : {opacity:[0,1,.7,1], scale:[1,1.4,1]}}
              transition={textExit ? exitTxt(0) : {duration:.4*DUR,repeat:Infinity,repeatDelay:2,ease:"easeInOut",times:[0,.4,1]}}
            >◆</motion.div>

            <motion.div
              style={{
                display:"flex", direction:"ltr",
                fontSize:15, letterSpacing:16, paddingRight:16,
                color:"#C9A84C",
                fontFamily:"'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight:300,
                WebkitFontSmoothing:"antialiased",
              }}
              animate={textExit ? exitText : {}}
              transition={textExit ? exitTxt(.04) : {}}
            >
              {"SIWAKY".split("").map((ch,i) => (
                <motion.span key={i}
                  initial={{opacity:0, y:8}}
                  animate={{opacity:1, y:0}}
                  transition={{delay:i*.05*DUR, duration:.32*DUR, ease:"easeOut"}}
                >{ch}</motion.span>
              ))}
            </motion.div>

            <motion.div
              className="sw-tagline"
              style={{
                fontSize: isMobile ? 20 : 24,
                color:"rgba(255,255,255,0.95)",
                fontFamily:"var(--font-naskh), 'Noto Naskh Arabic', serif",
                fontWeight:400,
                textShadow:"0 0 30px rgba(201,168,76,.4)",
                direction:"rtl",
                display:"flex", flexWrap:"nowrap", justifyContent:"center",
                gap:"0 6px",
                whiteSpace:"nowrap",
                width:"100%",
                textAlign:"center",
                WebkitFontSmoothing:"antialiased",
              }}
              animate={textExit ? exitText : {}}
              transition={textExit ? exitTxt(.08) : {}}
            >
              {"حيث تلتقي السنّة بالفخامة".split(" ").map((word,i) => (
                <motion.span key={i}
                  initial={{opacity:0}}
                  animate={{opacity:.92}}
                  transition={{delay:.16*DUR+i*.096*DUR, duration:.32*DUR}}
                >{word}</motion.span>
              ))}
            </motion.div>

            <motion.div
              style={{
                fontSize: isMobile ? 15 : 16, color:"rgba(201,168,76,0.7)",
                letterSpacing:5, paddingRight:5,
                fontFamily:"var(--font-naskh), 'Noto Naskh Arabic', serif",
                direction:"rtl",
                WebkitFontSmoothing:"antialiased",
              }}
              initial={{opacity:0}}
              animate={textExit ? exitText : {opacity:1}}
              transition={textExit ? exitTxt(.12) : {delay:.52*DUR, duration:.4*DUR}}
            >
              طهارة · أصالة · رقي
            </motion.div>
          </div>
        )}

        {/* ── Phase 6: lens flare — desktop only ── */}
        {!isMobile && phase>=6 && (
          <motion.div aria-hidden
            style={{
              position:"absolute", top:"44%", left:0, right:0,
              height:1,
              background:"linear-gradient(90deg, transparent 0%, rgba(255,240,150,.25) 15%, rgba(255,248,220,.95) 50%, rgba(255,240,150,.25) 85%, transparent 100%)",
              pointerEvents:"none", zIndex:10,
              transformOrigin:"left center",
            }}
            initial={{scaleX:0, opacity:1}}
            animate={{scaleX:1, opacity:[1,1,0]}}
            transition={{duration:.38, times:[0,.65,1], ease:"easeOut"}}
          />
        )}

        {/* ── Skip button ── */}
        <AnimatePresence>
          {skipVis && phase<4 && (
            <motion.button
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              transition={{duration:.32*DUR}}
              onClick={() => { sessionStorage.setItem("sw_splash_v2","1"); setExited(true); }}
              style={{
                position:"fixed", bottom:32, right:32,
                border:"1px solid rgba(201,168,76,.3)",
                padding:"6px 16px", borderRadius:20,
                background:"transparent", cursor:"pointer",
                fontSize:11, color:"rgba(201,168,76,.5)", letterSpacing:2,
                fontFamily:"var(--font-naskh), 'Noto Naskh Arabic', serif",
                transition:"border-color .2s,color .2s,box-shadow .2s",
                zIndex:10000,
              }}
              onMouseEnter={e=>{
                e.currentTarget.style.borderColor="#C9A84C";
                e.currentTarget.style.color="#C9A84C";
                e.currentTarget.style.boxShadow="0 0 12px rgba(201,168,76,.2)";
              }}
              onMouseLeave={e=>{
                e.currentTarget.style.borderColor="rgba(201,168,76,.3)";
                e.currentTarget.style.color="rgba(201,168,76,.5)";
                e.currentTarget.style.boxShadow="none";
              }}
            >تخطي</motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
