import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE } from "@/lib/dashboard/auth/constants";

/** Clears session cookie — public so expired tokens can still clear the cookie. */
export async function POST() {
  cookies().delete(DASHBOARD_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
