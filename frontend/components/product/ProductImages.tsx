"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";

import productPhoto from "@/lib/media/product-photo";

const GALLERY_SLOTS = 4;

export default function ProductImages() {
  const tTrust = useTranslations("trust");
  const tProduct = useTranslations("product");
  const [active, setActive] = useState(0);

  const photoAlt = tProduct("photoAlt");

  return (
    <div>
      <motion.div
        key={active}
        initial={{ opacity: 0.2 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/5 shadow-gold"
      >
        <Image
          src={productPhoto}
          alt={photoAlt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark/40 via-transparent to-transparent" />
        <span className="absolute top-4 start-4 badge-gold">{tTrust("halal")}</span>
      </motion.div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {Array.from({ length: GALLERY_SLOTS }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`relative aspect-square overflow-hidden rounded-xl border transition-all ${
              i === active ? "border-brand-gold shadow-gold" : "border-white/5 hover:border-brand-gold/50"
            }`}
            aria-label={`${photoAlt} — ${i + 1}`}
          >
            <Image
              src={productPhoto}
              alt=""
              fill
              sizes="(max-width: 768px) 22vw, 12vw"
              className="object-cover object-center"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
