"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const DOTS = 36;
const SPECKS = 14;

interface DotParticle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
}

interface SpeckParticle {
  id: number;
  left: string;
  top: string;
  rotate: number;
  width: number;
  duration: number;
  delay: number;
}

export default function GoldParticles() {
  const [mounted, setMounted] = useState(false);
  const [dots, setDots] = useState<DotParticle[]>([]);
  const [specks, setSpecks] = useState<SpeckParticle[]>([]);

  useEffect(() => {
    setDots(
      Array.from({ length: DOTS }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 2.5 + 1.8,
        duration: Math.random() * 10 + 14,
        delay: Math.random() * 10,
      })),
    );
    setSpecks(
      Array.from({ length: SPECKS }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        rotate: Math.random() * 180,
        width: Math.random() * 12 + 6,
        duration: Math.random() * 9 + 10,
        delay: Math.random() * 12,
      })),
    );
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((f) => (
        <motion.span
          key={f.id}
          className="absolute rounded-full bg-brand-gold shadow-[0_0_12px_rgba(201,168,76,0.45)]"
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
          }}
          animate={{
            y: [0, -90, -40],
            x: [-6, 8, -4],
            opacity: [0.12, 0.42, 0.1],
          }}
          transition={{
            duration: f.duration,
            repeat: Infinity,
            delay: f.delay,
            ease: "easeInOut",
          }}
        />
      ))}
      {specks.map((s) => (
        <motion.span
          key={`s-${s.id}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-brand-goldLight to-transparent opacity-70"
          style={{
            left: s.left,
            top: s.top,
            width: s.width,
            rotate: `${s.rotate}deg`,
          }}
          animate={{
            y: [0, 60, -30],
            opacity: [0, 0.55, 0],
            rotate: [s.rotate, s.rotate + 40],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
