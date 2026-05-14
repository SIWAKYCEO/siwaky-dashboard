import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Outer wrapper classes (beyond base glass chrome). */
  outerClassName?: string;
};

export function GlassPanel({ children, className = "", outerClassName = "" }: Props) {
  return (
    <div
      className={`group relative rounded-[1.35rem] border border-white/[0.078] bg-gradient-to-br from-white/[0.07] via-[#29292c]/92 to-[#1c1c1f]/92 p-[1px] shadow-glassLg backdrop-blur-2xl ${outerClassName}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[1.35rem] opacity-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-opacity duration-300 group-hover:opacity-100"
      />
      <div
        className={`relative h-full rounded-[calc(1.35rem-1px)] bg-gradient-to-b from-white/[0.04] via-transparent to-transparent ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
