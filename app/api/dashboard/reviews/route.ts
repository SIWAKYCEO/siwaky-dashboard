import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";
import { verifyDashboardSessionToken } from "@/lib/dashboard/auth/session";
import { getReviewsUpstreamBase } from "@/lib/dashboard/reviews-upstream";

export const dynamic = "force-dynamic";

/** GET /api/dashboard/reviews — proxy to storefront, returns all reviews (admin) */
export async function GET() {
  const token   = cookies().get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = await verifyDashboardSessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = `${getReviewsUpstreamBase()}/api/reviews`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Cookie: `${DASHBOARD_SESSION_COOKIE}=${token ?? ""}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("[api/dashboard/reviews GET] upstream error", e);
    return NextResponse.json({ error: "Reviews upstream unreachable" }, { status: 503 });
  }
}
