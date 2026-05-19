import type { NextRequest } from "next/server";

import { defaultLocale } from "@/i18n";

/** Production storefront domains — always shop, never dashboard (even if env is wrong). */
const CANONICAL_STOREFRONT_HOSTS = new Set(["siwaky.com", "www.siwaky.com"]);

/** Production dashboard domain only. */
const CANONICAL_DASHBOARD_HOSTS = new Set(["dashboard.siwaky.com", "www.dashboard.siwaky.com"]);

const DEFAULT_DASHBOARD_HOST = "dashboard.siwaky.com";
const DEFAULT_STOREFRONT_HOST = "siwaky.com";

/** Hostname only (no port), lowercased. */
export function requestHostname(req: NextRequest): string {
  const raw =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host")?.split(",")[0]?.trim() ||
    "";
  return raw.split(":")[0].toLowerCase();
}

function bareHost(hostname: string): string {
  return hostname.replace(/^www\./, "");
}

export function dashboardHostname(): string {
  return (process.env.DASHBOARD_HOST || DEFAULT_DASHBOARD_HOST).toLowerCase();
}

function hostsFromSiteUrl(): string[] {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!site) return [];
  try {
    const host = new URL(site.includes("://") ? site : `https://${site}`).hostname.toLowerCase();
    if (!host) return [];
    const bare = host.replace(/^www\./, "");
    return [host, bare, `www.${bare}`];
  } catch {
    return [];
  }
}

/** Hostnames that must serve the public shop only (never `/dashboard`). */
export function storefrontHostnames(): Set<string> {
  const hosts = new Set<string>(CANONICAL_STOREFRONT_HOSTS);
  for (const h of hostsFromSiteUrl()) hosts.add(h);
  const extra = process.env.STOREFRONT_HOSTS?.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) ?? [];
  for (const h of extra) hosts.add(h);
  if (hosts.size === CANONICAL_STOREFRONT_HOSTS.size) {
    hosts.add(DEFAULT_STOREFRONT_HOST);
    hosts.add(`www.${DEFAULT_STOREFRONT_HOST}`);
  }
  hosts.add("localhost");
  hosts.add("127.0.0.1");
  return hosts;
}

/** True only on the operator dashboard host — siwaky.com is never dashboard. */
export function isDashboardHostname(hostname: string): boolean {
  const bare = bareHost(hostname);
  if (CANONICAL_STOREFRONT_HOSTS.has(hostname) || bare === "siwaky.com") {
    return false;
  }
  if (CANONICAL_DASHBOARD_HOSTS.has(hostname) || bare === "dashboard.siwaky.com") {
    return true;
  }
  const configured = bareHost(dashboardHostname());
  return bare === configured;
}

export function isStorefrontHostname(hostname: string): boolean {
  const bare = bareHost(hostname);
  if (CANONICAL_STOREFRONT_HOSTS.has(hostname) || bare === "siwaky.com") {
    return true;
  }
  if (isDashboardHostname(hostname)) return false;
  return storefrontHostnames().has(hostname);
}

export function dashboardPublicOrigin(): string {
  const fromEnv = process.env.DASHBOARD_PUBLIC_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return `https://dashboard.siwaky.com`;
}

export function storefrontPublicOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return `https://siwaky.com`;
}

export function storefrontHomePath(): string {
  return `/${defaultLocale}`;
}

export function isShopLocalePath(pathname: string): boolean {
  return (
    pathname === "/ar" ||
    pathname === "/en" ||
    pathname.startsWith("/ar/") ||
    pathname.startsWith("/en/")
  );
}

export function isLegacyShopPath(pathname: string): boolean {
  const legacy = [
    "/product",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/shipping",
    "/returns",
    "/thank-you",
  ];
  return legacy.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function isDashboardApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/dashboard/");
}
