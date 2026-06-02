import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";
import { verifyDashboardSessionToken } from "@/lib/dashboard/auth/session";
import { getReviewsUpstreamBase } from "@/lib/dashboard/reviews-upstream";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** PATCH /api/dashboard/reviews/[id] — proxy approve/reject to storefront */
export async function PATCH(req: Request, { params }: Ctx) {
  const token   = cookies().get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = await verifyDashboardSessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as unknown;
  const url  = `${getReviewsUpstreamBase()}/api/reviews/${params.id}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${DASHBOARD_SESSION_COOKIE}=${token ?? ""}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("[api/dashboard/reviews PATCH]", e);
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 503 });
  }
}

/** DELETE /api/dashboard/reviews/[id] — proxy delete to storefront */
export async function DELETE(_req: Request, { params }: Ctx) {
  const token   = cookies().get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = await verifyDashboardSessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = `${getReviewsUpstreamBase()}/api/reviews/${params.id}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      cache: "no-store",
      headers: { Cookie: `${DASHBOARD_SESSION_COOKIE}=${token ?? ""}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("[api/dashboard/reviews DELETE]", e);
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 503 });
  }
}
