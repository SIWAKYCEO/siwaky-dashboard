import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";
import { verifyDashboardSessionToken } from "@/lib/dashboard/auth/session";
import { getDashboardOrdersUpstreamBase } from "@/lib/dashboard/orders-upstream";

export const dynamic = "force-dynamic";

/**
 * Proxies FastAPI `POST /push/test` — sends one server-side Web Push to the subscription in the body.
 */
export async function POST(req: Request) {
  const token = cookies().get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = await verifyDashboardSessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const upstreamBase = getDashboardOrdersUpstreamBase();
  const upstream = `${upstreamBase}/push/test`;
  try {
    const res = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: "Push test failed", detail: text.slice(0, 400), upstream },
        { status: res.status >= 500 ? 502 : res.status },
      );
    }
    try {
      return NextResponse.json(JSON.parse(text) as unknown);
    } catch {
      return NextResponse.json({ ok: true, raw: text });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Push test upstream unreachable", detail: message, upstream },
      { status: 503 },
    );
  }
}
