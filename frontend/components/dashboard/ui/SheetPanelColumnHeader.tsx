import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: ReactNode;
  showingCount: number;
  badge?: string;
};

/** Shared chrome for paired “sheet” columns (activity + orders). */
export function SheetPanelColumnHeader({
  eyebrow,
  title,
  subtitle,
  showingCount,
  badge = "Live sync",
}: Props) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-6 px-0.5">
      <div>
        <div className="flex items-start gap-3">
          <div className="mt-2 flex size-[11px] flex-none rounded-full bg-gradient-to-br from-emerald-200 via-[#c9a962] to-sky-300 shadow-[0_0_20px_-2px_rgba(167,243,208,.72)] motion-safe:animate-pulseSoft" />
          <div>
            <p className="font-dashSans text-[11px] font-semibold uppercase tracking-[0.32em] text-siwaky-muted">
              {eyebrow}
            </p>
            <p className="mt-3 font-dashDisplay text-lg font-semibold text-white md:text-xl">{title}</p>
          </div>
        </div>
        <div className="mt-4 max-w-md text-[12px] leading-relaxed text-siwaky-muted">{subtitle}</div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-3 rounded-[1rem] border border-white/[0.08] bg-black/52 px-[18px] py-2 shadow-inner backdrop-blur-md tabular-nums">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/62">
          Showing {showingCount}
        </span>
        <span className="rounded-lg border border-emerald-400/[0.2] bg-emerald-500/[0.12] px-2 py-[2px] font-dashSans text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/95">
          {badge}
        </span>
      </span>
    </div>
  );
}
