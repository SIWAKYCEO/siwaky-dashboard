"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useCartStore } from "@/store/cartStore";
import { OFFERS, type OfferId } from "@/lib/offers";
import { track } from "@/lib/pixels";

interface Props {
  offerId: OfferId;
}

/**
 * Visible only on mobile, fixed to the bottom of the viewport, after the user
 * has scrolled past the hero/offer block.
 */
export default function StickyAddToCart({ offerId }: Props) {
  const t = useTranslations();
  const addOffer = useCartStore((s) => s.addOffer);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const offer = OFFERS[offerId];

  const handleClick = () => {
    addOffer(offerId);
    track("AddToCart", {
      value: offer.price,
      currency: "SAR",
      content_ids: [offer.id],
      contents: [{ id: offer.id, quantity: offer.quantity, item_price: offer.price / offer.quantity }],
      content_type: "product",
    });
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 md:hidden transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="glass-dark border-t border-brand-gold/20 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <p className="text-white/60">{offer.quantity} × سواكي</p>
            <p className="text-base font-semibold text-white">
              {offer.price} {t("common.currency")}
            </p>
          </div>
          <button onClick={handleClick} className="btn-primary !py-3 !px-5 !text-sm">
            {t("product.addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}
