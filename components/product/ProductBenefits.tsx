"use client";

import {
  Activity,
  BookOpen,
  Gift,
  Leaf,
  Sparkles,
  Wind,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface Item {
  icon: string;
  title: string;
  desc: string;
}

const BENEFIT_ICONS = [Leaf, Activity, Sparkles, Wind, BookOpen, Gift] as const;

export default function ProductBenefits() {
  const t = useTranslations("product.benefits");
  const items = t.raw("items") as Item[];

  return (
    <section className="relative z-[1] bg-[#28282A] py-7 md:py-8">
      <div className="container-luxury">
        <div className="flex min-h-0 flex-col gap-6 md:max-h-[300px] md:flex-row md:items-start md:gap-10 md:overflow-y-auto md:overscroll-y-contain lg:gap-14">
          <header className="shrink-0 md:w-[min(280px,32%)] md:pt-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-brand-gold/85">
              {t("kicker")}
            </p>
            <h2 className="mt-2 font-display text-2xl leading-tight text-white md:text-[1.65rem]">
              {t("title")}
            </h2>
          </header>

          <ul className="grid flex-1 grid-cols-1 gap-x-10 gap-y-2 sm:grid-cols-2 sm:gap-y-2 md:content-start md:gap-x-12 md:gap-y-2">
            {items.map((it, i) => {
              const Icon = BENEFIT_ICONS[i] ?? Leaf;
              return (
                <li key={`${it.title}-${i}`} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-gold/[0.09] text-brand-gold shadow-[inset_0_0_0_1px_rgba(201,168,76,0.12)]"
                    aria-hidden
                  >
                    <Icon className="size-3.5" strokeWidth={1.65} />
                  </span>
                  <p className="min-w-0 text-[0.8125rem] leading-snug text-white/[0.82] md:text-[0.84375rem]">
                    <span className="font-medium text-white/95">{it.title}</span>
                    <span className="text-white/45"> · </span>
                    <span className="text-white/[0.72]">{it.desc}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
