/**
 * Thin gold fade line with a centered diamond — product / luxury section breaks.
 */
export default function GoldOrnamentalDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-hidden>
      <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent sm:inset-x-10 md:inset-x-14" />
      <div className="relative size-[9px] rotate-45 border border-brand-gold/50 bg-brand-dark shadow-[0_0_14px_-3px_rgba(201,168,76,0.45)]" />
    </div>
  );
}
