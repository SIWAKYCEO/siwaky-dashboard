import { cn } from "@/lib/utils";

export type LuxuryMediaPlaceholderVariant =
  | "hero"
  | "story"
  | "square"
  | "cta"
  | "flavorIcon"
  | "ingredientThumb"
  | "galleryMain"
  | "galleryThumb"
  | "cartThumb";

const shell: Record<LuxuryMediaPlaceholderVariant, string> = {
  hero: "absolute inset-0 min-h-full min-w-full",
  story: "aspect-[4/5] w-full rounded-2xl",
  square: "aspect-square w-full rounded-2xl",
  cta: "absolute inset-0 min-h-full w-full",
  flavorIcon:
    "relative flex h-[7rem] w-[7rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-gold/22 md:h-[7.25rem] md:w-[7.25rem]",
  ingredientThumb:
    "relative flex h-[5.75rem] w-[5.75rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-gold/20 sm:h-24 sm:w-24",
  galleryMain: "aspect-square w-full rounded-2xl",
  galleryThumb: "absolute inset-0 rounded-xl",
  cartThumb: "relative size-16 shrink-0 overflow-hidden rounded-xl border border-white/10",
};

interface Props {
  variant: LuxuryMediaPlaceholderVariant;
  className?: string;
  /** Tailwind gradient utility applied over base fill (e.g. flavor tint). */
  tintClass?: string;
}

function Layers({
  compact,
  hideCenterGlyph,
}: {
  compact: boolean;
  hideCenterGlyph?: boolean;
}) {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_78%_58%_at_50%_36%,rgba(201,168,76,0.13),transparent_62%)]" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[repeating-linear-gradient(-48deg,transparent,transparent_15px,rgba(201,168,76,0.38)_15px,rgba(201,168,76,0.38)_16px)] opacity-[0.055]"
      />
      <div className="absolute inset-0 ring-1 ring-inset ring-brand-gold/16" />
      {!hideCenterGlyph &&
        (compact ? (
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-gold/28 shadow-[inset_0_0_0_1px_rgba(201,168,76,0.08)]"
          />
        ) : (
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 size-[min(36%,100px)] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-md border border-brand-gold/24 bg-brand-gold/[0.035] shadow-[inset_0_1px_0_rgba(240,223,160,0.06)]"
          />
        ))}
    </>
  );
}

/**
 * Pure CSS luxury placeholder — no image requests (avoids broken assets until photography ships).
 */
export default function LuxuryMediaPlaceholder({ variant, className, tintClass }: Props) {
  const compact = variant === "galleryThumb" || variant === "cartThumb";
  const hideGalleryGlyphs = variant === "galleryMain" || variant === "galleryThumb";

  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden bg-[linear-gradient(165deg,#252527_0%,#1a1a1c_48%,#232325_100%)]",
        shell[variant],
        className,
      )}
    >
      {tintClass ? (
        <div className={cn("pointer-events-none absolute inset-0 opacity-[0.42]", tintClass)} aria-hidden />
      ) : null}
      <Layers compact={compact} hideCenterGlyph={hideGalleryGlyphs} />
    </div>
  );
}
