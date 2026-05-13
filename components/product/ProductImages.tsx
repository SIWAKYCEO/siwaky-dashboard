"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { productGalleryAlt } from "@/lib/seo/image-alts-ar";

const IMAGES = [
  "/images/product-1.jpg",
  "/images/product-2.jpg",
  "/images/product-3.jpg",
  "/images/product-4.jpg",
];

export default function ProductImages() {
  const [active, setActive] = useState(0);

  return (
    <div>
      <motion.div
        key={active}
        initial={{ opacity: 0.2 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl border border-white/5 shadow-gold"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGES[active]}
          alt={productGalleryAlt(active)}
          className="aspect-square w-full object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark/40 via-transparent to-transparent" />
        <span className="absolute top-4 start-4 badge-gold">حلال معتمد</span>
      </motion.div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {IMAGES.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            className={`relative aspect-square overflow-hidden rounded-xl border transition-all ${
              i === active
                ? "border-brand-gold shadow-gold"
                : "border-white/5 hover:border-brand-gold/50"
            }`}
            aria-label={productGalleryAlt(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={productGalleryAlt(i)}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
