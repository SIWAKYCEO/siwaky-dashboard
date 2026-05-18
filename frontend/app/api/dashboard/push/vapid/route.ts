import { NextResponse } from "next/server";

import { getDashboardOrdersUpstreamBase } from "@/lib/dashboard/orders-upstream";

export const dynamic = "force-dynamic";

/** Proxies FastAPI `GET /push/vapid-public` (public; no session required). */
export async function GET() {
  const upstreamBase = getDashboardOrdersUpstreamBase();
  const upstream = `${upstreamBase}/push/vapid-public`;
  try {
    const res = await fetch(upstream, { cache: "no-store" });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: "VAPID upstream failed", detail: text.slice(0, 200), upstream },
        { status: res.status >= 500 ? 503 : res.status },
      );
    }
    try {
      return NextResponse.json(JSON.parse(text) as { publicKey: string });
    } catch {
      return NextResponse.json({ error: "Invalid JSON from VAPID upstream" }, { status: 502 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "VAPID upstream unreachable", detail: message, upstream }, { status: 503 });
  }
}
