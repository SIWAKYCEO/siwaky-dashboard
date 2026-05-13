"use client";

import { useState } from "react";

import { IMAGE_ALT_AR } from "@/lib/seo/image-alts-ar";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const HEIGHT = { sm: "h-8", md: "h-11 md:h-13", lg: "h-16" } as const;
const TEXT_SIZE = { sm: "text-xl", md: "text-2xl", lg: "text-4xl" } as const;

/**
 * Renders /public/logo.png (transparent background, white mark).
 * Falls back to a typographic wordmark if the image fails to load.
 * No background color is ever applied to the <img> element.
 */
export default function Logo({ className = "", size = "md" }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`inline-flex select-none items-baseline gap-2 ${className}`}>
        <span className={`font-display font-bold gold-gradient-text leading-none ${TEXT_SIZE[size]}`}>
          سواكي
        </span>
        <span className={`font-serif leading-none tracking-[0.25em] text-white/90 ${TEXT_SIZE[size]}`}>
          SIWAKY
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex select-none items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt={IMAGE_ALT_AR.logo}
        onError={() => setFailed(true)}
        className={`${HEIGHT[size]} w-auto object-contain`}
        style={{ background: "none" }}
        draggable={false}
      />
    </div>
  );
}
