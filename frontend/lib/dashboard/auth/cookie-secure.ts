import { headers } from "next/headers";

/**
 * `secure` session cookies behind Traefik / Easypanel: the Node process often sees `http` while browsers
 * use `https`. Use `X-Forwarded-Proto` (and optional `NEXT_PUBLIC_SITE_URL`) instead of only `NODE_ENV`.
 */
export function isDashboardSessionCookieSecure(): boolean {
  if (process.env.DASHBOARD_SESSION_COOKIE_INSECURE === "true") return false;
  const raw = headers().get("x-forwarded-proto");
  if (raw) {
    const proto = raw.split(",")[0]?.trim().toLowerCase();
    if (proto === "https") return true;
    if (proto === "http") return false;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (site.startsWith("https://")) return true;
  return false;
}
