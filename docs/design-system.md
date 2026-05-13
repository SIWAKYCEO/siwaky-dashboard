# SIWAKY — Design System

> **Mood:** Dark luxury · cinematic · spiritual heritage · gold-on-black.
> **Reference vibe:** Saudi luxury brand (think مسك / عود / دار العطور) meets minimalist Apple-style product pages.

---

## 1. Brand colors

```css
:root {
  /* Primary surface */
  --black:        #000000;
  --dark:         #28282A;   /* default page bg */
  --dark-2:       #1A1A1A;   /* card / section alt */
  --off-white:    #F8F6F0;   /* off-white "paper" */
  --white:        #FFFFFF;

  /* Accent (gold) */
  --gold:         #C9A84C;   /* primary accent */
  --gold-light:   #F0DFA0;   /* highlight, hover glow */
  --gold-dark:    #A07830;   /* pressed, deep accents */

  /* Semantic */
  --success:      #22C55E;
  --danger:       #DC2626;   /* scarcity red */
}
```

Tailwind tokens (see `tailwind.config.ts`):

| Token              | Value     |
| ------------------ | --------- |
| `brand.black`      | `#000000` |
| `brand.dark`       | `#28282A` |
| `brand.dark2`      | `#1A1A1A` |
| `brand.offwhite`   | `#F8F6F0` |
| `brand.gold`       | `#C9A84C` |
| `brand.goldLight`  | `#F0DFA0` |
| `brand.goldDark`   | `#A07830` |

## 2. Typography

| Role             | Family               | Weight  | Usage                              |
| ---------------- | -------------------- | ------- | ---------------------------------- |
| Arabic display   | Scheherazade New     | 700     | Hero headlines, hadith, big copy   |
| Arabic body      | Noto Naskh Arabic    | 400/600 | Paragraphs, UI labels              |
| Latin            | Cormorant Garamond   | 400/600 | English headlines, prices, badges  |

All loaded via `next/font/google`. RTL is set on `<html dir="rtl">` for the `ar` locale.

**Type scale** (mobile → desktop):

| Token   | Mobile | Desktop |
| ------- | ------ | ------- |
| `h-display` | 40px / 1.1 | 80px / 1.05 |
| `h1`        | 32px / 1.15 | 56px / 1.1 |
| `h2`        | 26px / 1.2  | 40px / 1.15 |
| `h3`        | 20px / 1.3  | 28px / 1.25 |
| `body`      | 16px / 1.7  | 17px / 1.7  |
| `small`     | 13px / 1.5  | 14px / 1.5  |

## 3. Spacing & radii

- Base unit: `4px` (Tailwind default).
- Section vertical padding: `py-16 md:py-24`.
- Container max-width: `max-w-6xl mx-auto px-5`.
- Card radius: `rounded-2xl` (16 px).
- Button radius: `rounded-full` for primary CTAs.

## 4. Motion

Use Framer Motion sparingly — entrance + hover only.

| Pattern         | Setup                                                                         |
| --------------- | ----------------------------------------------------------------------------- |
| Section fade-up | `initial={{ opacity:0, y:32 }}`, `whileInView={{ opacity:1, y:0 }}`, `viewport={{ once:true, amount:0.3 }}`, `duration: 0.7` |
| Hero text reveal | stagger children, `delay: 0.1 * i`, `duration: 0.8`, `ease: [0.22,1,0.36,1]` |
| Card hover      | `whileHover={{ y:-4, boxShadow:'0 0 0 1px var(--gold)' }}`, `duration: 0.25` |
| Cart drawer     | `x: 100% → 0`, `spring`, `damping: 30`, `stiffness: 300`                     |

## 5. Components

### Buttons
```tsx
// Primary CTA (gold)
className="rounded-full bg-brand-gold px-8 py-4 text-brand-dark font-semibold tracking-wide
           shadow-[0_0_30px_-10px_rgba(201,168,76,0.6)]
           hover:bg-brand-goldLight transition-all duration-300"

// Ghost (dark backgrounds)
className="rounded-full border border-brand-gold/60 text-brand-gold px-6 py-3
           hover:bg-brand-gold/10 transition-all"
```

### Trust badge
```tsx
<div className="flex items-center gap-2 text-sm text-white/80">
  <CheckCircle className="size-4 text-brand-gold" />
  <span>حلال معتمد</span>
</div>
```

### Section divider (Islamic geometric)
Subtle gold pattern using `bg-[url('/patterns/divider.svg')]` or a CSS gradient strip:
`h-px w-32 bg-gradient-to-r from-transparent via-brand-gold to-transparent`.

## 6. Imagery

- **Hero:** dark, moody, full-bleed lifestyle shots. The hero gradient overlay should always cover at least 60% of the image with `bg-gradient-to-t from-brand-dark via-brand-dark/70 to-transparent`.
- **Product:** styled on dark velvet / marble surfaces with warm-gold rim light. Square (1:1) or 4:5 portrait.
- **Format:** `next/image`, `priority` only on hero. Avoid PNGs > 200 KB.

## 7. RTL specifics

- `<html lang="ar" dir="rtl">` is set by `[locale]/layout.tsx`.
- Tailwind uses logical properties via plugins where possible (`ps-`, `pe-`, `ms-`, `me-`, `start-0`, `end-0`).
- Flex/grid rows visually flip automatically in RTL — do **not** add `flex-row-reverse` unless overriding.
- Iconography that has a "direction" (arrows, chevrons): mirror with `rtl:rotate-180`.

## 8. Accessibility

- WCAG AA contrast on all gold-on-dark text (verified: `#C9A84C` on `#28282A` ≈ 6.4:1).
- Focus rings: `focus-visible:outline-2 focus-visible:outline-brand-gold focus-visible:outline-offset-2`.
- Inputs always have visible labels in Arabic and English alt text.
- All animations honor `prefers-reduced-motion`.

## 9. Pattern library (in code)

Tailwind utility classes that we re-use:

| Class                       | Purpose                                       |
| --------------------------- | --------------------------------------------- |
| `glass-dark`                | sticky header & modals                         |
| `card-luxury`               | dark gradient card with gold border on hover  |
| `gold-gradient-text`        | gold-to-light shimmer for headlines           |
| `divider-gold`              | thin gradient gold rule                       |
| `scarcity`                  | red pulse for "X left" labels                 |

All defined in `app/globals.css`.
