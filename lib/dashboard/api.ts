import type { OrdersPayload } from "@/lib/dashboard/types";

export function apiBase(): string {
  /**
   * Dashboard only: ignore `NEXT_PUBLIC_API_URL` (shop) so `.env.local` does not
   * send `/orders` to production by mistake.
   */
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
  return base.replace(/\/$/, "");
}

export async function fetchOrders(): Promise<OrdersPayload> {
  const res = await fetch(`${apiBase()}/orders`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Orders request failed (${res.status})`);
  }
  return (await res.json()) as OrdersPayload;
}
