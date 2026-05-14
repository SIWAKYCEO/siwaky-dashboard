import type { OrdersPayload } from "@/lib/dashboard/types";

/**
 * Dashboard data path (browser):
 * Always use the authenticated Next.js proxy — never call FastAPI `/orders` directly from
 * the client (that would bypass session cookies and expose sheet data).
 *
 * Server-side proxy: `app/api/dashboard/orders` → upstream from `DASHBOARD_ORDERS_API_BASE_URL`
 * or `NEXT_PUBLIC_API_BASE_URL`.
 *
 * Future: attach bearer tokens from session for multi-tenant APIs; RBAC via JWT `role`.
 */
export async function fetchOrders(): Promise<OrdersPayload> {
  const res = await fetch("/api/dashboard/orders", {
    cache: "no-store",
    credentials: "include",
  });
  if (res.status === 401) {
    throw new Error("Session expired — sign in again");
  }
  if (!res.ok) {
    throw new Error(`Orders request failed (${res.status})`);
  }
  return (await res.json()) as OrdersPayload;
}
