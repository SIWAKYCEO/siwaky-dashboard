"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { OFFERS, type OfferId } from "@/lib/offers";

const CART_LS_KEY = "siwaky-cart";

function persistEmptyCheckoutSnapshot(source?: string, campaign?: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(CART_LS_KEY);
    let wrap: Record<string, unknown> = {};
    if (raw) {
      try {
        wrap = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        wrap = {};
      }
    }
    const prevState =
      typeof wrap.state === "object" && wrap.state !== null ? (wrap.state as Record<string, unknown>) : {};
    wrap.state = {
      ...prevState,
      items: [],
      source: source ?? prevState.source,
      campaign: campaign ?? prevState.campaign,
    };
    window.localStorage.setItem(CART_LS_KEY, JSON.stringify(wrap));
  } catch {
    /* never block checkout */
  }
}

export interface CartItem {
  offerId: OfferId;
  quantity: number;
  price: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** Checkout modal — persisted cart drawer opens this; must close with drawer after order. */
  isCheckoutOpen: boolean;
  source?: string;
  campaign?: string;

  open: () => void;
  close: () => void;
  toggle: () => void;

  openCheckout: () => void;
  closeCheckout: () => void;

  addOffer: (offerId: OfferId) => void;
  setOffer: (offerId: OfferId) => void;     // single-product store: replace, not append
  removeOffer: (offerId: OfferId) => void;
  /** Empty cart, close drawer & checkout, persist [] — call after successful order & on thank-you. */
  clear: () => void;
  /** Alias — same as clear() */
  clearCart: () => void;
  /** Alias — closes drawer only */
  closeCart: () => void;

  setAttribution: (attr: { source?: string; campaign?: string }) => void;

  total: () => number;
  totalQty: () => number;
  currentOffer: () => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isCheckoutOpen: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      openCheckout: () => set({ isCheckoutOpen: true }),
      closeCheckout: () => set({ isCheckoutOpen: false }),

      addOffer: (offerId) => {
        const o = OFFERS[offerId];
        set({
          items: [{ offerId, quantity: 1, price: o.price }],
          isOpen: true,
        });
      },

      setOffer: (offerId) => {
        const o = OFFERS[offerId];
        set({ items: [{ offerId, quantity: 1, price: o.price }] });
      },

      removeOffer: (offerId) =>
        set((s) => ({ items: s.items.filter((i) => i.offerId !== offerId) })),

      /** Post-checkout / thank-you: empty cart, close drawer & checkout popup, persist items=[]. */
      clear: () => {
        const { source, campaign } = get();
        persistEmptyCheckoutSnapshot(source, campaign);
        set({ items: [], isOpen: false, isCheckoutOpen: false });
      },

      clearCart: () => get().clear(),
      closeCart: () => set({ isOpen: false }),

      setAttribution: ({ source, campaign }) =>
        set({ source: source ?? get().source, campaign: campaign ?? get().campaign }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalQty: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      currentOffer: () => get().items[0],
    }),
    {
      name: "siwaky-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        items: s.items,
        source: s.source,
        campaign: s.campaign,
      }),
      merge: (persistedState, currentState) => {
        const cur = currentState as CartState;
        const p = (persistedState ?? {}) as Partial<Pick<CartState, "items" | "source" | "campaign">>;
        return {
          ...cur,
          items: Array.isArray(p.items) ? p.items : [],
          source: p.source ?? cur.source,
          campaign: p.campaign ?? cur.campaign,
          isOpen: false,
          isCheckoutOpen: false,
        };
      },
    },
  ),
);
