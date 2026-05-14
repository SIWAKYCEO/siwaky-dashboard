import { NextResponse } from "next/server";

import { isDashboardAuthConfigured } from "@/lib/dashboard/auth/session";

export const dynamic = "force-dynamic";

/**
 * Quick deploy check: open `GET /api/health` on your public URL.
 * Does not expose secrets; includes internal reachability to the FastAPI `backend` service.
 */
export async function GET() {
  const ordersBase =
    process.env.DASHBOARD_ORDERS_API_BASE_URL?.replace(/\/$/, "") ?? "http://backend:8000";
  const healthUrl = `${ordersBase}/health`;

  let backendInternal: { ok: boolean; status?: number; error?: string; data?: unknown } = {
    ok: false,
  };
  try {
    const res = await fetch(healthUrl, { cache: "no-store" });
    const data = await res.json().catch(() => null);
    backendInternal = { ok: res.ok, status: res.status, data };
  } catch (e) {
    backendInternal = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    /** Runtime values seen by Node (Easypanel env). */
    nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL ?? null,
    nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    dashboardOrdersApiBase: process.env.DASHBOARD_ORDERS_API_BASE_URL ?? null,
    dashboardAuthConfigured: isDashboardAuthConfigured(),
    backendInternalHealthUrl: healthUrl,
    backendInternalHealth: backendInternal,
  });
}
