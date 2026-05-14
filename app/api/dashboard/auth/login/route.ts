import { NextResponse } from "next/server";
import { z } from "zod";

import { cookies } from "next/headers";

import {
  DASHBOARD_SESSION_COOKIE,
  DASHBOARD_SESSION_MAX_AGE_SEC,
} from "@/lib/dashboard/auth/constants";
import {
  isDashboardAuthConfigured,
  signDashboardSessionToken,
} from "@/lib/dashboard/auth/session";
import { verifyDashboardCredentials } from "@/lib/dashboard/auth/users";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(512),
});

/** Never accept credentials via GET — avoids passwords in URLs, logs, and referrers. */
export function GET() {
  return NextResponse.json(
    { error: "Method not allowed — sign in with POST and a JSON body." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function POST(req: Request) {
  if (!isDashboardAuthConfigured()) {
    return NextResponse.json({ error: "Dashboard auth is not configured" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password format" }, { status: 400 });
  }

  const user = await verifyDashboardCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    await new Promise((r) => setTimeout(r, 350));
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signDashboardSessionToken({ email: user.email, role: user.role });
  if (!token) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  cookies().set(DASHBOARD_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DASHBOARD_SESSION_MAX_AGE_SEC,
  });

  return NextResponse.json({ ok: true, email: user.email, role: user.role });
}
