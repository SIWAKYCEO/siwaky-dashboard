"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { OFFERS, type OfferId, savingsFor } from "@/lib/offers";

interface Props {
  value: OfferId;
  onChange: (id: OfferId) => void;
}

const ORDER: OfferId[] = ["box-1", "box-2", "box-3"];

export default function OfferSelector({ value, onChange }: Props) {
  const t = useTranslations();

  return (
    <div>
      <p className="mb-3 text-sm uppercase tracking-[0.3em] text-brand-goldLight">
        {t("product.selectOffer")}
      </p>

      <div className="space-y-3">
        {ORDER.map((id) => {
          const offer = OFFERS[id];
          const active = id === value;
          const save = savingsFor(id);

          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              whileTap={{ scale: 0.99 }}
              className={`relative w-full overflow-hidden rounded-2xl border p-4 text-start transition-all duration-200
                ${active
                  ? "border-brand-gold bg-brand-gold/10 shadow-gold"
                  : "border-white/10 bg-[#28282A]/95 hover:border-brand-gold/40"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors
                      ${active ? "border-brand-gold bg-brand-gold" : "border-white/30"}`}
                  >
                    {active && <Check className="size-3.5 text-brand-dark" strokeWidth={3} />}
                  </span>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-xl text-white">
                        {t(`product.offers.${id}.title`)}
                      </span>
                      {offer.badge && (
                        <span className="badge-gold">
                          {t(`product.offers.${id}.badge`)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-white/70">
                      {t(`product.offers.${id}.detail`)}
                    </p>
                  </div>
                </div>

                <div className="text-end">
                  <p className="font-serif text-2xl text-brand-goldLight">
                    {offer.price} {t("common.currency")}
                  </p>
                  {save > 0 && (
                    <p className="mt-1 text-xs text-emerald-300">
                      {t("common.save")} {save} {t("common.currency")}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
