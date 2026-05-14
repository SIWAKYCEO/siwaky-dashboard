"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { OFFERS, savingsFor, type OfferId } from "@/lib/offers";
import { useCartStore } from "@/store/cartStore";
import { track } from "@/lib/pixels";

interface Props {
  fromOffer: OfferId;
}

export default function UpgradeOffer({ fromOffer }: Props) {
  const t = useTranslations("cart");
  const setOffer = useCartStore((s) => s.setOffer);

  const upgrade: OfferId | null =
    fromOffer === "box-1" ? "box-2" : fromOffer === "box-2" ? "box-3" : null;

  if (!upgrade) return null;

  const offer = OFFERS[upgrade];

  const handle = () => {
    setOffer(upgrade);
    track("AddToCart", {
      value: offer.price,
      currency: "SAR",
      content_ids: [offer.id],
      contents: [{ id: offer.id, quantity: offer.quantity, item_price: offer.price / offer.quantity }],
      content_type: "product",
      upgrade: true,
    });
  };

  const copyKey = fromOffer === "box-1" ? "upgrade12" : "upgrade23";

  return (
    <button
      type="button"
      onClick={handle}
      className="group relative w-full overflow-hidden rounded-2xl border border-brand-gold/40 bg-gradient-to-br from-brand-gold/10 to-brand-gold/0 p-4 text-start transition-all hover:border-brand-gold hover:shadow-gold"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-brand-goldLight">
        {t("upgradeTitle")}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg text-white">{t(copyKey)}</p>
          <p className="mt-1 text-xs text-emerald-300">
            {t("upgradeSavings", { amount: savingsFor(upgrade) })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-brand-goldLight">
          <span className="font-serif text-xl">{t("priceFormat", { price: offer.price })}</span>
          <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}
