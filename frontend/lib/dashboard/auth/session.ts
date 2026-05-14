import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

import {
  DASHBOARD_AUTH_SECRET_FALLBACK,
  isDashboardUsersJsonNonEmpty,
} from "@/lib/dashboard/auth/env-defaults";
import { DASHBOARD_SESSION_MAX_AGE_SEC } from "@/lib/dashboard/auth/constants";

export type DashboardSession = {
  email: string;
  role: string;
};

/** Prefer env; Easypanel often injects empty strings that override image `ENV`. */
function resolvedAuthSecret(): string | null {
  const fromEnv = process.env.DASHBOARD_AUTH_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  const fb = DASHBOARD_AUTH_SECRET_FALLBACK.trim();
  return fb.length >= 32 ? fb : null;
}

function getSecretBytes(): Uint8Array | null {
  const s = resolvedAuthSecret();
  if (!s) return null;
  return new TextEncoder().encode(s);
}

const loggedPlaces = new Set<string>();

/**
 * Middleware (Edge) bundles literals from this module; `DASHBOARD_AUTH_SECRET_FALLBACK` is always available.
 * Prefer `console.log` for clarity; prod keeps `log` because `compiler.removeConsole` excludes it below.
 */
export function logDashboardAuthDiagnostics(where: string, includeUsersJson = true): void {
  const key = includeUsersJson ? `${where}:full` : `${where}:secret`;
  if (loggedPlaces.has(key)) return;
  loggedPlaces.add(key);
  console.log("AUTH SECRET:", resolvedAuthSecret() ? "SET" : "NOT SET");
  if (includeUsersJson) {
    console.log("USERS_JSON:", isDashboardUsersJsonNonEmpty() ? "SET" : "NOT SET");
  }
}

/** False when secret/users missing — Node routes show login + config hint */
export function isDashboardAuthConfigured(): boolean {
  logDashboardAuthDiagnostics("isDashboardAuthConfigured", true);
  return getSecretBytes() != null && isDashboardUsersJsonNonEmpty();
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
