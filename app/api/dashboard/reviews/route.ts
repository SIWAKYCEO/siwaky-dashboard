import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";
import { verifyDashboardSessionToken } from "@/lib/dashboard/auth/session";
import { getSql, ensureTable, type DbReview } from "@/lib/dashboard/reviews-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/dashboard/reviews — returns all reviews directly from PostgreSQL */
export async function GET() {
  const token   = cookies().get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = await verifyDashboardSessionToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureTable();
    const rows = await getSql()<DbReview[]>`SELECT * FROM reviews ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[api/dashboard/reviews GET]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
