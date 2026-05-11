"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { OFFERS, type OfferId } from "@/lib/offers";

export interface CartItem {
  offerId: OfferId;
  quantity: number;
  price: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  source?: string;
  campaign?: string;

  open: () => void;
  close: () => void;
  toggle: () => void;

  addOffer: (offerId: OfferId) => void;
  setOffer: (offerId: OfferId) => void;     // single-product store: replace, not append
  removeOffer: (offerId: OfferId) => void;
  clear: () => void;

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

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

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

      clear: () => set({ items: [] }),

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
    },
  ),
);
