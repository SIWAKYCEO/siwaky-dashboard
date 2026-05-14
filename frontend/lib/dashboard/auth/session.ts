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

const loggedPlaces = new Set<string>();

/**
 * Middleware (Edge) only sees vars present at **`next build`**. Node routes resolve runtime env + build.
 * Prefer `console.log` for clarity; prod keeps `log` because `compiler.removeConsole` excludes it below.
 */
export function logDashboardAuthDiagnostics(where: string, includeUsersJson = true): void {
  const key = includeUsersJson ? `${where}:full` : `${where}:secret`;
  if (loggedPlaces.has(key)) return;
  loggedPlaces.add(key);
  console.log("AUTH SECRET:", process.env.DASHBOARD_AUTH_SECRET ? "SET" : "NOT SET");
  if (includeUsersJson) {
    console.log("USERS_JSON:", dashboardUsersEnvPresent() ? "SET" : "NOT SET");
  }
}

/** False when secret/users missing — Node routes show login + config hint */
export function isDashboardAuthConfigured(): boolean {
  logDashboardAuthDiagnostics("isDashboardAuthConfigured", true);
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
