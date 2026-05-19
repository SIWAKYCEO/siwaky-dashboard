"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import TrustBadges from "@/components/shared/TrustBadges";
import ScarcityBar from "@/components/shared/ScarcityBar";

const PARTICLES = [
  { x: "8%",  y: "18%", size: 5, dur: 9.5,  delay: 0.0 },
  { x: "88%", y: "12%", size: 3, dur: 11.2, delay: 1.4 },
  { x: "5%",  y: "72%", size: 4, dur: 8.8,  delay: 0.6 },
  { x: "92%", y: "65%", size: 6, dur: 10.4, delay: 2.1 },
  { x: "20%", y: "88%", size: 3, dur: 12.0, delay: 0.9 },
  { x: "75%", y: "80%", size: 5, dur: 9.2,  delay: 1.7 },
  { x: "50%", y: "5%",  size: 4, dur: 10.8, delay: 0.3 },
  { x: "35%", y: "92%", size: 3, dur: 8.4,  delay: 2.5 },
  { x: "65%", y: "22%", size: 6, dur: 11.6, delay: 1.1 },
  { x: "15%", y: "45%", size: 4, dur: 9.8,  delay: 0.5 },
];

export default function HeroSection() {
  const t = useTranslations();
  const thero = useTranslations("hero");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  const headline = t("hero.headline");
  const words = headline.split(" ");

  return (
    <section className="relative min-h-[92vh] w-full overflow-hidden bg-brand-dark">
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#15171c] via-brand-dark to-[#0f1115]" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_12%,rgba(201,168,76,0.12),transparent_55%)]" aria-hidden />
      <div aria-hidden className="absolute -left-32 -top-32 size-[480px] rounded-full bg-brand-gold/10 blur-3xl" />
      <div aria-hidden className="absolute -right-24 bottom-0 size-[420px] rounded-full bg-brand-goldDark/15 blur-3xl" />

      {/* Floating gold particles */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-brand-gold"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          animate={{
            y: [0, -22, 10, -14, 0],
            x: [0, 9, -6, 5, 0],
            opacity: [0.15, 0.4, 0.12, 0.3, 0.15],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="container-luxury relative z-10 flex min-h-[92vh] flex-col items-center justify-center py-24 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="ornament mb-6 text-xs uppercase tracking-[0.4em] text-brand-goldLight"
        >
          SIWAKY
        </motion.span>

        {/* Staggered headline */}
        <h1 className="font-display text-4xl leading-[1.2] text-white sm:text-6xl md:text-7xl">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: "easeOut" }}
              className="inline-block me-[0.25em]"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28 }}
          className="mt-6 max-w-2xl text-lg leading-9 text-white/85 md:text-xl"
        >
          {t("hero.sub")}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.42 }}
          className="mt-3 font-serif text-sm uppercase tracking-[0.4em] text-brand-goldLight"
        >
          {t("hero.tagline")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          {/* Pulsing CTA */}
          <motion.div
            animate={{ scale: [1, 1.045, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
          >
            <Link href={`/${locale}/product`} className="btn-primary text-lg">
              {t("hero.cta")}
            </Link>
          </motion.div>
          <ScarcityBar
            initial={12}
            label={(n) => thero("scarcityCount", { count: n })}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12"
        >
          <TrustBadges />
        </motion.div>
      </div>
    </section>
  );
}
