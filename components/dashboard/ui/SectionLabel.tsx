"use client";

import type { ReactNode } from "react";

export function SectionLabel({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-end justify-between gap-4 pb-6 text-start">
      <div className="min-w-0 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-siwaky-gold">
          {eyebrow}
        </p>
        <div className="font-dashDisplay text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-[1.65rem]">
          {title}
        </div>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
