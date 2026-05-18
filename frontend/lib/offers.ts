export type OfferId = "box-1" | "box-2" | "box-3";

export interface Offer {
  id: OfferId;
  quantity: number;
  price: number;
  fullPrice: number;
  badge?: "best-seller" | "best-value";
}

export const OFFERS: Record<OfferId, Offer> = {
  "box-1": { id: "box-1", quantity: 1, price: 245, fullPrice: 245 },
  "box-2": { id: "box-2", quantity: 2, price: 299, fullPrice: 490, badge: "best-seller" },
  "box-3": { id: "box-3", quantity: 3, price: 349, fullPrice: 735, badge: "best-value" },
};

export const DEFAULT_OFFER: OfferId = "box-2";

export function savingsFor(id: OfferId): number {
  const o = OFFERS[id];
  return Math.max(0, o.fullPrice - o.price);
}
