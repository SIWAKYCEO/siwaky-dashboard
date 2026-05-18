import type { OrdersPayload } from "@/lib/dashboard/types";

/**
 * Dashboard data path (browser):
 * Always use the authenticated Next.js proxy — never call FastAPI `/orders` directly from
 * the client (that would bypass session cookies and expose sheet data).
 *
 * Server-side proxy: `app/api/dashboard/orders` → upstream from
 * `DASHBOARD_ORDERS_API_BASE_URL`, then `NEXT_PUBLIC_API_BASE_URL`, else `http://127.0.0.1:8000`.
 * (`NEXT_PUBLIC_API_URL` is intentionally not used — it targets the public API, not the FastAPI bridge.)
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

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await res.json();
  } catch {
    throw new Error(`Orders request failed (${res.status}); response was not JSON`);
  }

  const body = bodyUnknown as Record<string, unknown>;

  if (!res.ok) {
    const detail =
      typeof body.detail === "string"
        ? body.detail
        : typeof body.error === "string"
          ? body.error
          : "";
    const hint = typeof body.hint === "string" ? `\n${body.hint}` : "";
    const suffix = detail ? `: ${detail}` : "";
    throw new Error(`Orders request failed (${res.status})${suffix}${hint}`);
  }

  return bodyUnknown as OrdersPayload;
}
