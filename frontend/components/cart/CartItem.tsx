"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import type { CartItem as Item } from "@/store/cartStore";
import { useCartStore } from "@/store/cartStore";
import { SITE_PRODUCT_IMAGE_PATH } from "@/lib/seo/site";

interface Props {
  item: Item;
}

export default function CartItem({ item }: Props) {
  const t = useTranslations();
  const removeOffer = useCartStore((s) => s.removeOffer);

  return (
    <div className="flex items-center gap-3 py-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
        <Image
          src={SITE_PRODUCT_IMAGE_PATH}
          alt={t("product.photoAlt")}
          fill
          sizes="64px"
          className="object-cover object-center"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {t("product.cartItemLine", {
            brand: t("common.brandName"),
            title: t(`product.offers.${item.offerId}.title`),
          })}
        </p>
        <p className="mt-1 text-xs text-white/60">
          {t(`product.offers.${item.offerId}.detail`)}
        </p>
      </div>
      <div className="text-end">
        <p className="font-serif text-base text-brand-goldLight">
          {item.price * item.quantity} {t("common.currency")}
        </p>
        <button
          type="button"
          onClick={() => removeOffer(item.offerId)}
          className="mt-1 inline-flex items-center gap-1 text-xs text-white/50 hover:text-red-300"
        >
          <Trash2 className="size-3.5" />
          {t("cart.remove")}
        </button>
      </div>
    </div>
  );
}
