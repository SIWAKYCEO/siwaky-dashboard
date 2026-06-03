import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";
import { verifyDashboardSessionToken } from "@/lib/dashboard/auth/session";
import { getDashboardOrdersUpstreamBase } from "@/lib/dashboard/orders-upstream";
import type { OrderRow, OrdersPayload } from "@/lib/dashboard/types";

export const dynamic = "force-dynamic";

// ── Country re-derivation from stored ip_address ─────────────────────────────

const _geoCache = new Map<string, { country: string; iso: string; exp: number }>();

function isRoutableIp(ip: string): boolean {
  if (!ip || ip === "0.0.0.0" || ip === "127.0.0.1" || ip === "::1") return false;
  // Private ranges (RFC 1918 + loopback + link-local)
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|fc|fd)/.test(ip)) return false;
  return true;
}

async function resolveCountries(ips: string[]): Promise<Map<string, string>> {
  const now = Date.now();
  const result = new Map<string, string>();
  const toFetch: string[] = [];

  for (const ip of ips) {
    const cached = _geoCache.get(ip);
    if (cached && cached.exp > now) {
      result.set(ip, `${cached.country} (${cached.iso})`);
    } else {
      toFetch.push(ip);
    }
  }

  if (toFetch.length > 0) {
    try {
      const batch = toFetch.slice(0, 100);
      const res = await fetch("http://ip-api.com/batch?fields=query,country,countryCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch.map((q) => ({ query: q }))),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const entries = (await res.json()) as Array<{
          query: string;
          country?: string;
          countryCode?: string;
          status?: string;
        }>;
        const exp = now + 24 * 60 * 60 * 1000;
        for (const e of entries) {
          if (e.status === "success" && e.country && e.countryCode) {
            _geoCache.set(e.query, { country: e.country, iso: e.countryCode, exp });
            result.set(e.query, `${e.country} (${e.countryCode})`);
          }
        }
      }
    } catch (e) {
      console.warn("[api/dashboard/orders] geo lookup failed, using stored country values:", e instanceof Error ? e.message : String(e));
    }
  }

  return result;
}

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

    // Re-derive country from the stored ip_address so historical orders
    // show the correct country even if the stored country field is stale.
    const uniqueIps = [
      ...new Set(
        data.orders
          .map((o: OrderRow) => o.ip_address?.trim() ?? "")
          .filter(isRoutableIp),
      ),
    ];

    if (uniqueIps.length > 0) {
      const geoMap = await resolveCountries(uniqueIps);
      if (geoMap.size > 0) {
        data = {
          ...data,
          orders: data.orders.map((o: OrderRow) => {
            const ip = o.ip_address?.trim() ?? "";
            const derivedCountry = geoMap.get(ip);
            return derivedCountry ? { ...o, country: derivedCountry } : o;
          }),
        };
      }
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/dashboard/orders] unexpected error", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
