import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";
import { verifyDashboardSessionToken } from "@/lib/dashboard/auth/session";
import { getSql, ensureTable, type DbReview } from "@/lib/dashboard/reviews-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

/** PATCH /api/dashboard/reviews/[id] — approve or reject */
export async function PATCH(req: Request, { params }: Ctx) {
  const token   = cookies().get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = await verifyDashboardSessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { approved: boolean; status?: string };
  const status = body.status === "approved" || body.status === "rejected" || body.status === "pending"
    ? body.status
    : body.approved ? "approved" : "rejected";

  try {
    await ensureTable();
    const rows = await getSql()<DbReview[]>`
      UPDATE reviews
      SET approved = ${body.approved}, status = ${status}
      WHERE id = ${params.id}
      RETURNING *
    `;
    if (rows.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/dashboard/reviews PATCH]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

/** DELETE /api/dashboard/reviews/[id] */
export async function DELETE(_req: Request, { params }: Ctx) {
  const token   = cookies().get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = await verifyDashboardSessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureTable();
    await getSql()`DELETE FROM reviews WHERE id = ${params.id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/dashboard/reviews DELETE]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
