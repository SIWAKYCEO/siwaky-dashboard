"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import TrustBadges from "@/components/shared/TrustBadges";
import ScarcityBar from "@/components/shared/ScarcityBar";
import productPhoto from "@/lib/media/product-photo";

export default function HeroSection() {
  const t = useTranslations();
  const thero = useTranslations("hero");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  return (
    <section className="relative min-h-[92vh] w-full overflow-hidden">
      <div className="absolute inset-0" aria-hidden>
        <Image
          src={productPhoto}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)]" />
      </div>

      {/* Decorative gold radial */}
      <div
        aria-hidden
        className="absolute -left-32 -top-32 size-[480px] rounded-full bg-brand-gold/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-24 bottom-0 size-[420px] rounded-full bg-brand-goldDark/15 blur-3xl"
      />

      <div className="container-luxury relative z-10 flex min-h-[92vh] flex-col items-center justify-center py-24 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="ornament mb-6 text-xs uppercase tracking-[0.4em] text-brand-goldLight"
        >
          SIWAKY
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05 }}
          className="font-display text-4xl leading-[1.1] text-white sm:text-6xl md:text-7xl"
        >
          {t("hero.headline")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18 }}
          className="mt-6 max-w-2xl text-lg leading-9 text-white/85 md:text-xl"
        >
          {t("hero.sub")}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.32 }}
          className="mt-3 font-serif text-sm uppercase tracking-[0.4em] text-brand-goldLight"
        >
          {t("hero.tagline")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <Link href={`/${locale}/product`} className="btn-primary text-lg">
            {t("hero.cta")}
          </Link>
          <ScarcityBar
            initial={12}
            label={(n) => thero("scarcityCount", { count: n })}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-12"
        >
          <TrustBadges />
        </motion.div>
      </div>
    </section>
  );
}
