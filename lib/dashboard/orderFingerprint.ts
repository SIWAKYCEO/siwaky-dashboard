import type { OrderRow } from "@/lib/dashboard/types";

function norm(s: string | undefined): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

function simpleHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Stable row identity for polling diffs (does not depend on list index). */
export function stableOrderFingerprint(order: OrderRow): string {
  const basis = [
    norm(order.phone),
    norm(order.product),
    norm(order.city),
    norm(order.country),
    norm(order.qty),
    norm(order.price_sar),
    norm(order.status),
    norm(order.name),
    norm(order.confirmed),
    norm(order.delivered),
    norm(order.returned),
    norm(order.cod_fee),
    norm(order.ip_address),
    norm(order.devic),
  ].join("|");
  return `fp${simpleHash(basis)}`;
}

export function fingerprintOrderSnapshot(orders: OrderRow[]): Set<string> {
  return new Set(orders.map(stableOrderFingerprint));
}
