import bcrypt from "bcryptjs";

import { resolvedDashboardUsersJsonRaw } from "@/lib/dashboard/auth/env-defaults";

/**
 * Allowed operators parsed from `DASHBOARD_USERS_JSON`.
 *
 * Production: use `passwordHash` only (bcrypt). Generate:
 *   node -e "console.log(require('bcryptjs').hashSync('secret',12))"
 *
 * Dev-only plaintext: set `password` ONLY when `DASHBOARD_AUTH_ALLOW_PLAINTEXT_PASSWORDS=true`
 * (never enable in production).
 *
 * Future: replace this loader with DB / IdP; keep JWT `{ role }` for RBAC expansion.
 */
export type DashboardUserRecord = {
  email: string;
  /** Bcrypt hash — preferred */
  passwordHash?: string;
  /** Plaintext — allowed only with `DASHBOARD_AUTH_ALLOW_PLAINTEXT_PASSWORDS=true` */
  password?: string;
  /** RBAC placeholder: `admin` | `operator` | future roles */
  role?: string;
};

/** Match raw env text so edits to `.env.local` apply after dev reload without stale cached users. */
let cachedUsers: DashboardUserRecord[] | null = null;
let cachedRawFingerprint: string | undefined = undefined;

function plaintextPasswordsAllowedEnv(): boolean {
  const v = process.env.DASHBOARD_AUTH_ALLOW_PLAINTEXT_PASSWORDS?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function normalizeUsersJsonRaw(raw: string | undefined): string {
  if (raw == null) return "";
  return raw.replace(/^\uFEFF/, "").trim();
}

export function loadDashboardUsers(): DashboardUserRecord[] {
  const raw = normalizeUsersJsonRaw(resolvedDashboardUsersJsonRaw());
  if (!raw) {
    cachedUsers = [];
    cachedRawFingerprint = raw;
    return cachedUsers;
  }
  if (cachedUsers !== null && cachedRawFingerprint === raw) {
    return cachedUsers;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error("DASHBOARD_USERS_JSON must be a JSON array");
    cachedUsers = parsed.map((row) => {
      const r = row as Record<string, unknown>;
      const email = typeof r.email === "string" ? r.email : "";
      const passwordHash = typeof r.passwordHash === "string" ? r.passwordHash : undefined;
      const password = typeof r.password === "string" ? r.password : undefined;
      const role = typeof r.role === "string" ? r.role : undefined;
      return { email, passwordHash, password, role };
    });
    cachedRawFingerprint = raw;
    return cachedUsers;
  } catch (e) {
    console.error("[dashboard/auth] Invalid DASHBOARD_USERS_JSON", e);
    cachedUsers = [];
    cachedRawFingerprint = undefined;
    return cachedUsers;
  }
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function verifyDashboardCredentials(
  emailRaw: string,
  password: string,
): Promise<{ email: string; role: string } | null> {
  const email = emailRaw.trim().toLowerCase();
  const users = loadDashboardUsers();
  const plaintextMode = plaintextPasswordsAllowedEnv();

  // eslint-disable-next-line no-console -- temporary POST login diagnostics (no passwords)
  console.log("[dashboard/auth] login-debug receivedEmail=", emailRaw.trim());
  // eslint-disable-next-line no-console -- temporary POST login diagnostics (no passwords)
  console.log("[dashboard/auth] login-debug usersLoadedCount=", users.length);
  // eslint-disable-next-line no-console -- temporary POST login diagnostics (no passwords)
  console.log("[dashboard/auth] login-debug plaintextMode=", plaintextMode);

  const user = users.find((u) => u.email.trim().toLowerCase() === email);

  if (!user || typeof password !== "string") {
    // eslint-disable-next-line no-console -- temporary POST login diagnostics (no passwords)
    console.log("[dashboard/auth] login-debug passwordComparePassed=", false);
    return null;
  }

  const storedHash =
    typeof user.passwordHash === "string" && user.passwordHash.trim().length > 0
      ? user.passwordHash.trim()
      : undefined;

  let ok = false;

  if (storedHash) {
    try {
      ok = await bcrypt.compare(password, storedHash);
    } catch {
      ok = false;
    }
  }

  /**
   * Plaintext compare when explicitly allowed — runs when no hash, hash mismatch,
   * or invalid bcrypt material (helps misconfigured dev JSON alongside plaintext passwords).
   */
  if (!ok && plaintextMode && typeof user.password === "string") {
    const storedPlain = user.password.replace(/\r\n/g, "\n").trim();
    const attemptPlain = password.replace(/\r\n/g, "\n").trim();
    ok = timingSafeEqualStrings(attemptPlain, storedPlain);
  }

  // eslint-disable-next-line no-console -- temporary POST login diagnostics (no passwords)
  console.log("[dashboard/auth] login-debug passwordComparePassed=", ok);

  if (!ok) return null;
  return {
    email: user.email.trim(),
    role: user.role?.trim() || "operator",
  };
}
