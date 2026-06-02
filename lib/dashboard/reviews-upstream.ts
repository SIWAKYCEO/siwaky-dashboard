/**
 * Base URL of the storefront (siwaky.com) for server-side proxy calls to
 * the reviews API.
 *
 * Resolution order:
 *  1. FRONTEND_STORE_URL  — explicit override (e.g. http://frontend:3000 on Docker)
 *  2. NEXT_PUBLIC_SITE_URL — already set to https://siwaky.com in both services
 *  3. Hard-coded fallback   — https://siwaky.com (prod) / http://localhost:3000 (dev)
 */
function nonEmpty(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t || undefined;
}

export function getReviewsUpstreamBase(): string {
  const explicit = nonEmpty(process.env.FRONTEND_STORE_URL);
  if (explicit) return explicit.replace(/\/$/, "");

  const siteUrl = nonEmpty(process.env.NEXT_PUBLIC_SITE_URL);
  if (siteUrl) return siteUrl.replace(/\/$/, "");

  return process.env.NODE_ENV === "production"
    ? "https://siwaky.com"
    : "http://localhost:3000";
}

/**
 * Shared secret sent as X-Dashboard-Token header so the storefront can
 * authenticate internal calls without relying on cookie-based JWT forwarding.
 * Uses the same DASHBOARD_AUTH_SECRET already required by both services.
 */
export function getReviewsInternalToken(): string {
  return process.env.DASHBOARD_AUTH_SECRET ?? "";
}
