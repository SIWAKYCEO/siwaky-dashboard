"use client";

/** Small pill reflecting pipeline state (delivered, transit, etc.). */

type Accent = {
  label: string;
  ringClass: string;
  dotClass: string;
  textClass: string;
};

export function StatusBadge({
  accent,
  compact = false,
}: {
  accent: Accent;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 truncate rounded-full border border-white/[0.1] bg-black/40 px-2.5 py-1 ${compact ? "text-[10px]" : "text-[11px]"} font-semibold uppercase tracking-[0.12em] text-white/90 ring-1 ring-white/[0.04] backdrop-blur-md`}
    >
      <span
        aria-hidden
        className={`h-2 w-2 flex-none shrink-0 rounded-full ring-[3px] ${accent.dotClass} ${accent.ringClass}`}
      />
      <span className={`min-w-0 truncate ${accent.textClass}`}>{accent.label}</span>
    </span>
  );
}
