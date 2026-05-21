"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import OfferSelector from "@/components/product/OfferSelector";
import ProductImages from "@/components/product/ProductImages";
import GoldOrnamentalDivider from "@/components/shared/GoldOrnamentalDivider";
import TrustBadges from "@/components/shared/TrustBadges";
import StickyAddToCart from "@/components/shared/StickyAddToCart";

import { DEFAULT_OFFER, OFFERS, toBaseOfferId, type OfferId } from "@/lib/offers";
import { track } from "@/lib/pixels";
import { useCartStore } from "@/store/cartStore";

interface Props {
  discountPrice?: number | null;
}

export default function ProductHero({ discountPrice }: Props) {
  const t = useTranslations();
  const [offer, setOffer] = useState<OfferId>(discountPrice ? "box-1" : DEFAULT_OFFER);
  const addOffer = useCartStore((s) => s.addOffer);

  const effectivePrice = offer === "box-1" && discountPrice ? discountPrice : undefined;

  const handleAdd = () => {
    const o = OFFERS[toBaseOfferId(offer)];
    const price = effectivePrice ?? o.price;
    addOffer(offer, effectivePrice);
    track("AddToCart", {
      value: price,
      currency: "SAR",
      content_ids: [o.id],
      contents: [{ id: o.id, quantity: o.quantity, item_price: price / o.quantity }],
      content_type: "product",
    });
  };

  return (
    <section id="product-hero-top" className="bg-[#28282A] pt-8 md:pt-12">
      {discountPrice && (
        <div className="container-luxury mb-6">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-brand-gold/50 bg-brand-gold/10 px-4 py-3 text-center font-sans text-sm font-semibold text-brand-goldLight">
            ⚡ عرض خاص لك — سعر مخفّض
          </div>
        </div>
      )}

      <div className="container-luxury grid items-start gap-10 md:grid-cols-2 md:gap-14">
        <ProductImages />

        <div>
          <h1 className="font-display text-3xl leading-tight text-white md:text-5xl">{t("product.title")}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 font-sans text-sm text-white/80">
            <span className="inline-flex items-center gap-1 text-brand-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-brand-gold" />
              ))}
              <span className="ms-1 text-white/80">({t("product.ratingCount")})</span>
            </span>
          </div>

          <div className="mt-7">
            <OfferSelector
              value={offer}
              onChange={setOffer}
              discountOverride={discountPrice ? { offerId: "box-1", price: discountPrice } : undefined}
            />
          </div>

          <button type="button" onClick={handleAdd} className="btn-primary mt-6 w-full text-lg">
            {t("product.addToCart")}
          </button>

          <div className="mt-6">
            <TrustBadges variant="grid" />
          </div>
        </div>
      </div>

      <div className="container-luxury mt-8 pb-2 md:mt-10">
        <GoldOrnamentalDivider className="py-2 md:py-3" />
      </div>

      <StickyAddToCart offerId={offer} priceOverride={effectivePrice} />
    </section>
  );
}
