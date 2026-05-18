import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";
import {
  logDashboardAuthDiagnostics,
  verifyDashboardSessionToken,
} from "@/lib/dashboard/auth/session";
import {
  dashboardPublicOrigin,
  isDashboardApiPath,
  isDashboardHostname,
  isDashboardPath,
  isLegacyShopPath,
  isShopLocalePath,
  isStorefrontHostname,
  requestHostname,
  storefrontHomePath,
  storefrontPublicOrigin,
} from "@/lib/host-routing";

const LOGIN_PATH = "/dashboard/login";

function isLoginPage(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
}

function isPublicDashboardApi(pathname: string): boolean {
  return (
    pathname === "/api/dashboard/auth/login" ||
    pathname.startsWith("/api/dashboard/auth/login/") ||
    pathname === "/api/dashboard/auth/logout" ||
    pathname.startsWith("/api/dashboard/auth/logout/")
  );
}

/**
 * siwaky.com / www → shop only. dashboard.siwaky.com → dashboard only.
 * Same Next.js process can serve both domains; separation is by Host header.
 */
function hostSeparationMiddleware(req: NextRequest): NextResponse | null {
  const hostname = requestHostname(req);
  const { pathname, search } = req.nextUrl;

  if (isStorefrontHostname(hostname)) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL(storefrontHomePath(), req.url));
    }
    if (isDashboardPath(pathname)) {
      const target = new URL(pathname + search, dashboardPublicOrigin());
      return NextResponse.redirect(target, 308);
    }
    if (isDashboardApiPath(pathname)) {
      return NextResponse.json(
        { error: "dashboard_api_wrong_host", detail: "Use dashboard.siwaky.com for operator APIs." },
        { status: 404 },
      );
    }
    return null;
  }

  if (isDashboardHostname(hostname)) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL("/dashboard", req.url), 308);
    }
    if (isShopLocalePath(pathname) || isLegacyShopPath(pathname)) {
      const target = new URL(pathname + search, storefrontPublicOrigin());
      return NextResponse.redirect(target, 308);
    }
    return null;
  }

  return null;
}

async function dashboardAuthMiddleware(req: NextRequest): Promise<NextResponse> {
  logDashboardAuthDiagnostics("middleware-edge");
  const { pathname } = req.nextUrl;

  const touchesDashboardUi = isDashboardPath(pathname);
  const touchesDashboardApi = isDashboardApiPath(pathname);

  if (!touchesDashboardUi && !touchesDashboardApi) {
    return NextResponse.next();
  }

  if (touchesDashboardUi && isLoginPage(pathname)) {
    const token = req.cookies.get(DASHBOARD_SESSION_COOKIE)?.value;
    const session = await verifyDashboardSessionToken(token);
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (touchesDashboardApi && isPublicDashboardApi(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = await verifyDashboardSessionToken(token);

  if (!session) {
    if (touchesDashboardApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-dashboard-email", session.email);
  requestHeaders.set("x-dashboard-role", session.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export async function middleware(req: NextRequest) {
  try {
    const hostGuard = hostSeparationMiddleware(req);
    if (hostGuard) return hostGuard;

    const { pathname } = req.nextUrl;
    const touchesDashboard =
      isDashboardPath(pathname) || isDashboardApiPath(pathname);

    if (touchesDashboard) {
      return await dashboardAuthMiddleware(req);
    }

    return NextResponse.next();
  } catch (err) {
    console.error("[middleware]", err);
    const { pathname } = req.nextUrl;
    if (isDashboardApiPath(pathname)) {
      return NextResponse.json({ error: "Middleware failure" }, { status: 500 });
    }
    if (isDashboardPath(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = LOGIN_PATH;
      url.searchParams.set("error", "mw");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/dashboard/:path*",
    "/api/dashboard/:path*",
    "/ar",
    "/en",
    "/ar/:path*",
    "/en/:path*",
    "/product",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/shipping",
    "/returns",
    "/thank-you",
  ],
};
