import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";
import { verifyDashboardSessionToken } from "@/lib/dashboard/auth/session";
import { getReviewsInternalToken, getReviewsUpstreamBase } from "@/lib/dashboard/reviews-upstream";

export const dynamic = "force-dynamic";

/** GET /api/dashboard/reviews — proxy to storefront, returns all reviews (admin) */
export async function GET() {
  const token   = cookies().get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = await verifyDashboardSessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url           = `${getReviewsUpstreamBase()}/api/reviews`;
  const internalToken = getReviewsInternalToken();

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        // Primary auth: shared secret — works regardless of JWT env-var parity
        ...(internalToken ? { "X-Dashboard-Token": internalToken } : {}),
        // Fallback auth: forward the session cookie in case the storefront also verifies it
        Cookie: `${DASHBOARD_SESSION_COOKIE}=${token ?? ""}`,
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("[api/dashboard/reviews GET] upstream error", e);
    return NextResponse.json({ error: "Reviews upstream unreachable" }, { status: 503 });
  }
}
