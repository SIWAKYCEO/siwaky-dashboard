import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";
import { verifyDashboardSessionToken } from "@/lib/dashboard/auth/session";
import { getDashboardOrdersUpstreamBase } from "@/lib/dashboard/orders-upstream";
import type { OrdersPayload } from "@/lib/dashboard/types";

export const dynamic = "force-dynamic";

/**
 * Proxies FastAPI `/orders` only for authenticated dashboard sessions.
 * See `getDashboardOrdersUpstreamBase` for env resolution.
 */
export async function GET() {
  try {
    const token = cookies().get(DASHBOARD_SESSION_COOKIE)?.value;
    const session = await verifyDashboardSessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const upstreamBase = getDashboardOrdersUpstreamBase();
    console.log("Fetching from:", upstreamBase + "/orders");

    try {
      const healthUrl = `${upstreamBase}/health`;
      const h = await fetch(healthUrl, { cache: "no-store" });
      const healthText = await h.text();
      let healthJson: unknown = null;
      try {
        healthJson = JSON.parse(healthText) as unknown;
      } catch {
        /* not JSON */
      }
      console.log("[api/dashboard/orders] health probe (Next.js → FastAPI):", healthUrl, {
        ok: h.ok,
        status: h.status,
        bodyPreview: healthText.slice(0, 240),
        json: healthJson,
      });
    } catch (e) {
      console.error("[api/dashboard/orders] health probe failed", e);
    }

    const upstream = `${upstreamBase}/orders`;

    let res: Response;
    try {
      res = await fetch(upstream, { cache: "no-store" });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      console.error("[api/dashboard/orders] upstream unreachable", { upstream, message });
      const devHint =
        process.env.NODE_ENV === "development"
          ? "Start FastAPI — e.g. `npm run dev --prefix backend`. Verify `curl http://127.0.0.1:8000/health`. Frontend `.env.local`: DASHBOARD_ORDERS_API_BASE_URL=http://127.0.0.1:8000"
          : "If Next runs in Docker, set DASHBOARD_ORDERS_API_BASE_URL=http://backend:8000 for the frontend service (localhost inside a container is not the API).";
      return NextResponse.json(
        {
          error: "Orders upstream unreachable",
          detail: `Next.js could not reach ${upstream}. Start the FastAPI bridge and set DASHBOARD_ORDERS_API_BASE_URL (recommended) or NEXT_PUBLIC_API_BASE_URL.`,
          upstream,
          hint: devHint,
        },
        { status: 503 },
      );
    }

    if (!res.ok) {
      const snippet = (await res.text()).slice(0, 500);
      console.error("[api/dashboard/orders] upstream HTTP error", res.status, snippet);
      return NextResponse.json(
        {
          error: `Orders upstream failed (${res.status})`,
          detail: snippet || undefined,
          upstream,
        },
        { status: 502 },
      );
    }

    let data: OrdersPayload;
    try {
      const raw = (await res.json()) as unknown;
      if (Array.isArray(raw)) {
        const orders = raw as OrdersPayload["orders"];
        data = { count: orders.length, orders };
      } else if (
        raw &&
        typeof raw === "object" &&
        Array.isArray((raw as OrdersPayload).orders)
      ) {
        data = raw as OrdersPayload;
      } else {
        return NextResponse.json(
          {
            error: "Orders upstream returned unexpected JSON (expected array or { orders })",
            upstream,
          },
          { status: 502 },
        );
      }
    } catch {
      return NextResponse.json(
        {
          error: "Orders upstream returned invalid JSON",
          upstream,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/dashboard/orders] unexpected error", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
