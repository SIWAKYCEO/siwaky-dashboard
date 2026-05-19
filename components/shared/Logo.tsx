"use client";

import Image from "next/image";
import { useLocale } from "next-intl";

import { IMAGE_ALT_EN } from "@/lib/seo/image-alts-en";
import { IMAGE_ALT_AR } from "@/lib/seo/image-alts-ar";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  shimmer?: boolean;
}

const IMG_CLASS = {
  sm: "!h-7 sm:!h-8 w-auto max-w-none",
  md: "!h-9 sm:!h-10 w-auto max-w-none",
  lg: "!h-11 sm:!h-14 md:!h-[3.75rem] w-auto max-w-none",
  xl: "!h-[3.44rem] sm:!h-[4.375rem] md:!h-[4.6875rem] w-auto max-w-none",
  "2xl": "!h-[4.3rem] sm:!h-[5.5rem] md:!h-[5.875rem] w-auto max-w-none",
} as const;

const logoSrc = `/logo.png?v=${encodeURIComponent(process.env.NEXT_PUBLIC_LOGO_REVISION ?? "6")}`;

export default function Logo({ className = "", size = "md", shimmer = false }: LogoProps) {
  const locale = useLocale();
  const alt = locale === "en" ? IMAGE_ALT_EN.logo : IMAGE_ALT_AR.logo;

  return (
    <span className={`relative inline-flex shrink-0 select-none items-center bg-transparent ${shimmer ? "overflow-hidden" : ""} ${className}`}>
      <Image
        src={logoSrc}
        alt={alt}
        width={512}
        height={160}
        draggable={false}
        priority={size === "lg" || size === "xl" || size === "2xl"}
        unoptimized
        className={`object-contain object-start ${IMG_CLASS[size]}`}
      />
      {shimmer && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brand-goldLight/40 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
        />
      )}
    </span>
  );
}
