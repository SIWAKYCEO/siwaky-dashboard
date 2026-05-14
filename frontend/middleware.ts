import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";
import {
  logDashboardAuthDiagnostics,
  verifyDashboardSessionToken,
} from "@/lib/dashboard/auth/session";

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

async function dashboardMiddleware(req: NextRequest): Promise<NextResponse> {
  logDashboardAuthDiagnostics("middleware-edge", false);
  const { pathname } = req.nextUrl;

  const touchesDashboardUi = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const touchesDashboardApi = pathname.startsWith("/api/dashboard/");

  if (!touchesDashboardUi && !touchesDashboardApi) {
    return NextResponse.next();
  }

  /** Logged-in users should not stay on the login screen */
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
    return await dashboardMiddleware(req);
  } catch (err) {
    console.error("[middleware/dashboard]", err);
    const { pathname } = req.nextUrl;
    if (pathname.startsWith("/api/dashboard/")) {
      return NextResponse.json({ error: "Middleware failure" }, { status: 500 });
    }
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("error", "mw");
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/api/dashboard/:path*"],
};
