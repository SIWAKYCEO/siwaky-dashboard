"use client";

import Image from "next/image";

import { IMAGE_ALT_AR } from "@/lib/seo/image-alts-ar";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/** Height-led sizing; proportions come from asset via `object-contain`. */
const IMG_CLASS = {
  sm: "!h-7 sm:!h-8 w-auto max-w-none",
  md: "!h-9 sm:!h-10 w-auto max-w-none",
  lg: "!h-11 sm:!h-14 md:!h-[3.75rem] w-auto max-w-none",
} as const;

/** `public/logo.png` served as static file (no `/_next/image` proxy) + `v=` query for CDN. */
const logoSrc = `/logo.png?v=${encodeURIComponent(process.env.NEXT_PUBLIC_LOGO_REVISION ?? "6")}`;

export default function Logo({ className = "", size = "md" }: LogoProps) {
  return (
    <span className={`inline-flex shrink-0 select-none items-center bg-transparent ${className}`}>
      <Image
        src={logoSrc}
        alt={IMAGE_ALT_AR.logo}
        width={512}
        height={160}
        draggable={false}
        priority={size === "lg"}
        unoptimized
        className={`object-contain object-start ${IMG_CLASS[size]}`}
      />
    </span>
  );
}
