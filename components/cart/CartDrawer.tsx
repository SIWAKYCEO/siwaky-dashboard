"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import CartItem from "@/components/cart/CartItem";
import UpgradeOffer from "@/components/cart/UpgradeOffer";
import CheckoutPopup from "@/components/checkout/CheckoutPopup";

import { track } from "@/lib/pixels";
import { useCartStore } from "@/store/cartStore";

function isThankYouPath(path: string | null | undefined): boolean {
  if (!path) return false;
  return path.includes("thank-you");
}

export default function CartDrawer() {
  const t = useTranslations();
  const pathname = usePathname();
  const isOpen = useCartStore((s) => s.isOpen);
  const checkoutOpen = useCartStore((s) => s.isCheckoutOpen);
  const items = useCartStore((s) => s.items);
  const close = useCartStore((s) => s.close);
  const clearCart = useCartStore((s) => s.clearCart);
  const openCheckout = useCartStore((s) => s.openCheckout);
  const closeCheckout = useCartStore((s) => s.closeCheckout);
  const total = useCartStore((s) => s.total());
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  const hideShell = isThankYouPath(pathname);

  useEffect(() => {
    if (!hideShell) return;
    document.body.style.overflow = "";
    clearCart();
    closeCheckout();
  }, [hideShell, clearCart, closeCheckout]);

  useEffect(() => {
    if (hideShell) return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, hideShell]);

  const handleCheckout = () => {
    if (items.length === 0) return;
    track("InitiateCheckout", {
      value: total,
      currency: "SAR",
      contents: items.map((i) => ({ id: i.offerId, quantity: i.quantity, item_price: i.price })),
    });
    openCheckout();
  };

  if (hideShell) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              aria-hidden
            />
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="fixed end-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-s border-brand-gold/20 bg-brand-dark shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label={t("cart.title")}
            >
              <header className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <h2 className="font-display text-2xl text-white">🛒 {t("cart.title")}</h2>
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex size-9 items-center justify-center rounded-full hover:bg-white/5"
                  aria-label={t("common.close")}
                >
                  <X className="size-5" />
                </button>
              </header>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <p className="text-white/70">{t("cart.empty")}</p>
                  <Link href={`/${locale}/product`} onClick={close} className="btn-ghost-gold mt-5">
                    {t("cart.emptyCta")}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-5">
                    <div className="divide-y divide-white/5">
                      {items.map((it) => (
                        <CartItem key={it.offerId} item={it} />
                      ))}
                    </div>

                    <div className="mt-4">
                      <UpgradeOffer fromOffer={items[0].offerId} />
                    </div>

                    <p className="mt-5 text-xs text-white/60">{t("cart.urgency")}</p>
                  </div>

                  <footer className="border-t border-white/5 bg-brand-dark2/60 px-5 py-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80">{t("cart.subtotal")}</span>
                      <span className="font-serif text-2xl text-brand-goldLight">
                        {total} {t("common.currency")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-emerald-300">{t("cart.shipping")}</p>
                    <button type="button" onClick={handleCheckout} className="btn-primary mt-4 w-full text-base">
                      {t("cart.checkout")} ←
                    </button>
                    <p className="mt-3 text-center text-[11px] text-white/50">{t("cart.trust")}</p>
                  </footer>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CheckoutPopup open={checkoutOpen} onClose={closeCheckout} />
    </>
  );
}
