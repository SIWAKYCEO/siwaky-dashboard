"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";

import LuxuryMediaPlaceholder from "@/components/shared/LuxuryMediaPlaceholder";
import { getFlavorVisual } from "@/lib/flavors-visual";

/** Order matches `product.ingredients.items`: arak → natural, mint, clove, coconut. */
const INGREDIENT_FLAVOR_KEYS = ["natural", "mint", "clove", "coconut"] as const;

interface Ingredient {
  title: string;
  desc: string;
}

export default function Ingredients() {
  const t = useTranslations("product.ingredients");
  const items = t.raw("items") as Ingredient[];

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55 }}
      className="bg-[#28282A] py-14 md:py-20"
    >
      <div className="container-luxury">
        <div className="text-center">
          <h2 className="font-display text-3xl text-white md:text-[2.75rem]">{t("title")}</h2>
          <p className="mx-auto mt-4 max-w-3xl font-sans text-base leading-8 text-white/72">{t("science")}</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {items.map((it, i) => {
            const flavorKey = INGREDIENT_FLAVOR_KEYS[i];
            const visual = flavorKey ? getFlavorVisual(flavorKey) : undefined;

            return (
              <motion.article
                key={`${it.title}-${i}`}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="rounded-2xl border border-[rgba(201,168,76,0.28)] bg-[#28282A] px-6 py-6 shadow-[inset_0_1px_0_rgba(201,168,76,0.06)] md:px-7 md:py-7"
              >
                <div className="flex gap-4 sm:gap-5">
                  {visual ? (
                    <div className="relative flex h-[5.75rem] w-[5.75rem] shrink-0 overflow-hidden rounded-xl border border-brand-gold/20 sm:h-24 sm:w-24">
                      <div
                        aria-hidden
                        className={`absolute inset-0 bg-gradient-to-br ${visual.tint} opacity-[0.38]`}
                      />
                      <Image
                        src={visual.img}
                        alt={it.title}
                        width={208}
                        height={208}
                        className="relative z-[1] h-full w-full object-contain p-2"
                      />
                    </div>
                  ) : (
                    <LuxuryMediaPlaceholder variant="ingredientThumb" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl text-white md:text-[1.35rem]">{it.title}</h3>
                    <p className="mt-2 font-sans text-sm leading-7 text-white/72 md:text-[0.9375rem]">{it.desc}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
