import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { defaultLocale, locales } from "./i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

const STATIC_EXT =
  /\.(?:ico|png|jpe?g|gif|svg|webp|woff2?|ttf|eot|txt|xml|json|webmanifest|map)$/i;

/** PDP must not be cached — stale HTML keeps old chunks / old markup. */
function applyPdpNoStoreHeaders(request: NextRequest, response: Response) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  const isPdp = pathname === "/ar/product" || pathname === "/en/product";
  if (!isPdp) return;

  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("CDN-Cache-Control", "no-store");

  const build = process.env.NEXT_PUBLIC_APP_BUILD_ID;
  if (build) response.headers.set("X-Siwaky-Build", build);
}

/**
 * Never run locale middleware on Next internals — otherwise `/_next/static/*`
 * returns 500 and the app shell cannot load.
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    STATIC_EXT.test(pathname)
  ) {
    return NextResponse.next();
  }

  const norm = pathname.replace(/\/+$/, "") || "/";

  if (norm === "/dashboard" || norm.startsWith("/dashboard/")) {
    return NextResponse.next();
  }

  try {
    const response = intlMiddleware(request);
    applyPdpNoStoreHeaders(request, response);
    return response;
  } catch (cause) {
    console.error("[middleware] next-intl failed; passing through:", cause);
    return NextResponse.next();
  }
}

/** Covers `/` and all segments; paths under `/_next/` never match → middleware not invoked. */
export const config = {
  matcher: ["/((?!_next/).*)"],
};
