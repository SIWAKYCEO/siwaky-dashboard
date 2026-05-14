import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";
import { verifyDashboardSessionToken } from "@/lib/dashboard/auth/session";
import type { OrdersPayload } from "@/lib/dashboard/types";

/**
 * Proxies FastAPI `/orders` only for authenticated dashboard sessions.
 * Prefer `DASHBOARD_ORDERS_API_BASE_URL` (server-only); falls back for local dev only.
 */
function ordersUpstreamBase(): string {
  const base =
    process.env.DASHBOARD_ORDERS_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8000";
  return base.replace(/\/$/, "");
}

export async function GET() {
  const token = cookies().get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = await verifyDashboardSessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const upstream = `${ordersUpstreamBase()}/orders`;
  const res = await fetch(upstream, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Orders upstream failed (${res.status})` },
      { status: 502 },
    );
  }

  const data = (await res.json()) as OrdersPayload;
  return NextResponse.json(data);
}
