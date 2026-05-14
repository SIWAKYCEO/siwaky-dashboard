import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { defaultLocale, locales } from "./i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

/** PDP must not be cached at the edge — stale HTML keeps old chunks / old markup on phones. */
function applyPdpNoStoreHeaders(request: NextRequest, response: Response) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  const isPdp = pathname === "/ar/product" || pathname === "/en/product";
  if (!isPdp) return;

  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  /* Cloudflare / some proxies honour this even when Cache-Control is rewritten */
  response.headers.set("CDN-Cache-Control", "no-store");

  const build = process.env.NEXT_PUBLIC_APP_BUILD_ID;
  if (build) response.headers.set("X-Siwaky-Build", build);
}

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  applyPdpNoStoreHeaders(request, response);
  return response;
}

// Exclude extensioned static files AND Next.js metadata routes (/icon, /apple-icon from app/icon.png etc.)
export const config = {
  matcher: ["/((?!api|_next|_vercel|icon$|apple-icon$|.*\\..*).*)"],
};
