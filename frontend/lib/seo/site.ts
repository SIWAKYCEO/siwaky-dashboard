/** Base URL helpers for dashboard deployment (robots/sitemap only). */

export const SITE_URL = (
  process.env.DASHBOARD_PUBLIC_ORIGIN ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://dashboard.siwaky.com"
).replace(/\/$/, "");
