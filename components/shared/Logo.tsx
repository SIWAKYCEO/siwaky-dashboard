"use client";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const TEXT_SIZE = { sm: "text-xl", md: "text-2xl", lg: "text-4xl" } as const;

/** CSS-only luxury wordmark — no image fetch (avoids broken logo asset). */
export default function Logo({ className = "", size = "md" }: LogoProps) {
  return (
    <div className={`inline-flex select-none items-baseline gap-2 bg-transparent ${className}`}>
      <span className={`font-display font-bold gold-gradient-text leading-none ${TEXT_SIZE[size]}`}>سواكي</span>
      <span className={`font-serif leading-none tracking-[0.25em] text-white/90 ${TEXT_SIZE[size]}`}>SIWAKY</span>
    </div>
  );
}
