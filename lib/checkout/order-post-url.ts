/**
 * Canonical browser POST endpoint for storefront checkout inserts.
 *
 * Prefer same-origin `/api/orders` (Next.js route → FastAPI). When the storefront
 * is served from another host/CDN without that route, set
 * **`NEXT_PUBLIC_CHECKOUT_POST_URL`** to the deployment that exposes `/api/orders`
 * (see `frontend/next.config.js`).
 */

export const CHECKOUT_ORDER_POST_PATH = "/api/orders";

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Normalize optional override env: full URL, with `/api/orders` appended if missing.
 */
export function resolveCheckoutPostOverrideUrl(raw: unknown): string | null {
  const o = trimmed(raw);
  if (!o) return null;
  if (!/^https?:\/\//i.test(o)) {
    console.warn("[siwaky/checkout] NEXT_PUBLIC_CHECKOUT_POST_URL must be absolute (https://…) — ignoring");
    return null;
  }
  const normalized = o.replace(/\/+$/, "");
  if (/\/api\/orders$/i.test(normalized)) return normalized;
  return `${normalized}${CHECKOUT_ORDER_POST_PATH}`;
}

/**
 * Resolved absolute POST URL (`https://origin/api/orders` or override).
 */
export function checkoutOrderPostAbsoluteUrl(): string {
  const override = resolveCheckoutPostOverrideUrl(process.env.NEXT_PUBLIC_CHECKOUT_POST_URL);
  if (override) return override;

  if (typeof window !== "undefined") {
    return `${window.location.origin}${CHECKOUT_ORDER_POST_PATH}`;
  }

  const site = trimmed(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000";
  const base = site.replace(/\/+$/, "");
  return `${base}${CHECKOUT_ORDER_POST_PATH}`;
}
