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
 * Mobile-only sticky bar — appears after scrolling past the hero block.
 */
export default function StickyAddToCart({ offerId }: Props) {
  const t = useTranslations();
  const addOffer = useCartStore((s) => s.addOffer);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
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
      className={`fixed inset-x-0 bottom-0 z-40 md:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="border-t-2 border-brand-gold/45 bg-[#28282A] px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-12px_40px_-12px_rgba(40,40,42,0.75)]">
        <div className="flex items-center justify-between gap-3">
          <div className="font-sans text-sm">
            <p className="text-white/55">
              {t("product.stickyLine", {
                qty: offer.quantity,
                brand: t("common.brandName"),
              })}
            </p>
            <p className="text-base font-semibold text-white">
              {offer.price} {t("common.currency")}
            </p>
          </div>
          <button type="button" onClick={handleClick} className="btn-primary !px-6 !py-3 !text-sm">
            {t("product.addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}
