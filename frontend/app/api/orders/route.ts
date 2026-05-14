import { NextResponse } from "next/server";

import { getDashboardOrdersUpstreamBase } from "@/lib/dashboard/orders-upstream";

export const dynamic = "force-dynamic";

/** Proxies storefront checkout POST to FastAPI `/api/orders` (same Postgres as `/orders`). */
export async function POST(req: Request) {
  let body: string;
  try {
    body = await req.text();
  } catch (e) {
    console.error("[api/orders] failed to read request body", e);
    return NextResponse.json({ error: "bad_request", detail: "invalid_body" }, { status: 400 });
  }

  const upstreamBase = getDashboardOrdersUpstreamBase().replace(/\/$/, "");
  const upstream = `${upstreamBase}/api/orders`;

  try {
    const res = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
        "x-real-ip": req.headers.get("x-real-ip") ?? "",
        "user-agent": req.headers.get("user-agent") ?? "",
      },
      body,
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      console.warn("[api/orders] upstream HTTP error", {
        upstream,
        httpStatus: res.status,
        bodyPreview: text.slice(0, 500),
      });
    }

    const contentTypeHeader = res.headers.get("content-type");
    const contentType =
      contentTypeHeader && contentTypeHeader.trim().length > 0
        ? contentTypeHeader.split(";")[0]?.trim()
        : "application/json";

    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType || "application/json" },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    console.error("[api/orders] upstream unreachable", { upstream, message });

    const devHint =
      process.env.NODE_ENV === "development"
        ? "Start FastAPI (e.g. `npm run dev --prefix backend`) and set frontend `.env.local`: DASHBOARD_ORDERS_API_BASE_URL=http://127.0.0.1:8000"
        : "Ensure DASHBOARD_ORDERS_API_BASE_URL=http://backend:8000 for the frontend container";

    return NextResponse.json(
      {
        error: "upstream_unreachable",
        detail: message,
        upstream,
        hint: devHint,
      },
      { status: 503 },
    );
  }
}
