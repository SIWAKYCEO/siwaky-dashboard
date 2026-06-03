import { NextResponse } from "next/server";

import { CHECKOUT_ORDER_POST_PATH } from "@/lib/checkout/order-post-url";
import { getDashboardOrdersUpstreamBase } from "@/lib/dashboard/orders-upstream";

export const dynamic = "force-dynamic";

/**
 * Extract the real client IP in priority order:
 * 1. CF-Connecting-IP (Cloudflare's trusted single-IP header)
 * 2. First entry of X-Forwarded-For (leftmost = original client)
 * 3. X-Real-IP
 * 4. Empty string (FastAPI falls back to socket address)
 */
function extractRealClientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  const xff = req.headers.get("x-forwarded-for")?.trim();
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const xReal = req.headers.get("x-real-ip")?.trim();
  if (xReal) return xReal;

  return "";
}

function redactUpstreamBase(base: string): string {
  try {
    const u = new URL(base.includes("://") ? base : `http://${base}`);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "(invalid_url)";
  }
}

/** Proxies storefront checkout POST to FastAPI `/api/orders` (same Postgres as `/orders`). */
export async function POST(req: Request) {
  console.log("[siwaky/api/orders] storefront proxy POST invoked", {
    path: CHECKOUT_ORDER_POST_PATH,
    requestUrl: req.url,
    hostHeader: req.headers.get("host") ?? undefined,
    userAgentSnippet: req.headers.get("user-agent")?.slice(0, 80) ?? undefined,
  });

  let body: string;
  try {
    body = await req.text();
  } catch (e) {
    console.error("[siwaky/api/orders] failed to read request body", e);
    return NextResponse.json({ error: "bad_request", detail: "invalid_body" }, { status: 400 });
  }

  const upstreamBase = getDashboardOrdersUpstreamBase().replace(/\/$/, "");
  const upstream = `${upstreamBase}/api/orders`;

  const realClientIp = extractRealClientIp(req);

  console.log("[siwaky/api/orders] forwarding to FastAPI", {
    fastapiUpstream: redactUpstreamBase(upstreamBase),
    fastapiOrdersPath: "/api/orders",
    bodyBytes: new TextEncoder().encode(body).length,
    realClientIp: realClientIp || "(empty — FastAPI will use socket addr)",
    hint: `Browser should POST ...${CHECKOUT_ORDER_POST_PATH} on storefront origin unless NEXT_PUBLIC_CHECKOUT_POST_URL is set.`,
  });

  try {
    const res = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward the real client IP so FastAPI's _client_ip() reads it correctly.
        // Both headers set to the same clean IP — FastAPI reads x-forwarded-for first.
        "x-forwarded-for": realClientIp,
        "x-real-ip": realClientIp,
        "user-agent": req.headers.get("user-agent") ?? "",
      },
      body,
      cache: "no-store",
    });

    const text = await res.text();

    if (res.ok) {
      console.log("[siwaky/api/orders] upstream OK — order accepted by FastAPI", {
        httpStatus: res.status,
        bodyPreviewOk: text.slice(0, 180),
      });
    } else {
      console.warn("[siwaky/api/orders] upstream HTTP error — order may not exist in Postgres", {
        upstream: redactUpstreamBase(upstream),
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
    console.error("[siwaky/api/orders] upstream unreachable — no insert possible", {
      upstream: redactUpstreamBase(upstream),
      message,
    });

    const devHint =
      process.env.NODE_ENV === "development"
        ? "Start FastAPI — e.g. `npm run dev --prefix backend` — and set frontend `.env.local`: DASHBOARD_ORDERS_API_BASE_URL=http://127.0.0.1:8000"
        : "Ensure DASHBOARD_ORDERS_API_BASE_URL=http://backend:8000 on the frontend service (Easypanel/Compose internal DNS).";

    return NextResponse.json(
      {
        error: "upstream_unreachable",
        detail: message,
        upstreamHint: `${redactUpstreamBase(upstream)}`,
        hint: devHint,
      },
      { status: 503 },
    );
  }
}
