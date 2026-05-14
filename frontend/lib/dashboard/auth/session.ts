import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

import { DASHBOARD_SESSION_MAX_AGE_SEC } from "@/lib/dashboard/auth/constants";

export type DashboardSession = {
  email: string;
  role: string;
};

function getSecretBytes(): Uint8Array | null {
  const s = process.env.DASHBOARD_AUTH_SECRET;
  if (!s || s.length < 32) return null;
  return new TextEncoder().encode(s);
}

/** Align with `loadDashboardUsers()` — BOM / whitespace breaks JSON.parse when absent here. */
function dashboardUsersEnvPresent(): boolean {
  const raw = process.env.DASHBOARD_USERS_JSON?.replace(/^\uFEFF/, "").trim();
  return Boolean(raw);
}

/** False when secret/users missing — middleware shows login + config hint */
export function isDashboardAuthConfigured(): boolean {
  const secretOk = getSecretBytes() != null;
  return secretOk && dashboardUsersEnvPresent();
}

export async function signDashboardSessionToken(session: DashboardSession): Promise<string | null> {
  const secret = getSecretBytes();
  if (!secret) return null;
  return await new SignJWT({
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.email)
    .setIssuedAt()
    .setExpirationTime(`${DASHBOARD_SESSION_MAX_AGE_SEC}s`)
    .sign(secret);
}

export async function verifyDashboardSessionToken(
  token: string | undefined | null,
): Promise<DashboardSession | null> {
  if (!token) return null;
  const secret = getSecretBytes();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const email = typeof payload.sub === "string" ? payload.sub : null;
    if (!email) return null;
    const role = typeof payload.role === "string" ? payload.role : "operator";
    return { email, role };
  } catch {
    return null;
  }
}
