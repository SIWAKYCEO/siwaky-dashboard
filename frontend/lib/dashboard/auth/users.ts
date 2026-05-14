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

/**
 * Env UIs often strip the leading `$` from bcrypt hashes (`$2b$12$...` → `2b$12$...`).
 * bcrypt requires the full `$2b$...` prefix.
 */
function normalizePossiblyMangledBcryptHash(hash: string): string {
  const h = hash.trim();
  if (h.startsWith("$")) return h;
  if (/^2[aby]\$\d{2}\$/.test(h)) return `$${h}`;
  return h;
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
  const rawJson = resolvedDashboardUsersJsonRaw();
  const users = loadDashboardUsers();
  const plaintextMode = plaintextPasswordsAllowedEnv();

  // eslint-disable-next-line no-console -- login diagnostics (remove after fixing Easypanel hash/env)
  console.log("[dashboard/auth] login-debug rawJsonLength=", rawJson.length);
  // eslint-disable-next-line no-console
  console.log(
    "[dashboard/auth] login-debug parsedUsersSummary=",
    JSON.stringify(
      users.map((u) => ({
        email: u.email,
        passwordHashLen: u.passwordHash?.length ?? 0,
        hashPrefix: u.passwordHash?.slice(0, 8) ?? null,
        hashStartsWithDollar: u.passwordHash?.startsWith("$") ?? false,
      })),
    ),
  );

  // eslint-disable-next-line no-console -- login diagnostics
  console.log("[dashboard/auth] login-debug compareRequest", {
    emailNormalized: email,
    passwordLength: password.length,
    usersLoadedCount: users.length,
    plaintextMode,
  });

  const user = users.find((u) => u.email.trim().toLowerCase() === email);

  if (!user || typeof password !== "string") {
    // eslint-disable-next-line no-console
    console.log("[dashboard/auth] login-debug noUserOrPassword", { userFound: Boolean(user) });
    return null;
  }

  const storedHashRaw =
    typeof user.passwordHash === "string" && user.passwordHash.trim().length > 0
      ? user.passwordHash.trim()
      : undefined;
  const storedHash = storedHashRaw ? normalizePossiblyMangledBcryptHash(storedHashRaw) : undefined;

  if (storedHashRaw && storedHash && storedHashRaw !== storedHash) {
    // eslint-disable-next-line no-console
    console.log("[dashboard/auth] login-debug repairedBcryptPrefix", {
      beforeLen: storedHashRaw.length,
      afterLen: storedHash.length,
    });
  }

  let ok = false;

  if (storedHash) {
    try {
      // bcryptjs.compare(plainText, hash) — hash must include leading `$2b$...`
      // eslint-disable-next-line no-console
      console.log("[dashboard/auth] login-debug bcrypt.compare", {
        plainLength: password.length,
        hashLength: storedHash.length,
        hashFirstChars: storedHash.slice(0, 10),
      });
      ok = await bcrypt.compare(password, storedHash);
      // eslint-disable-next-line no-console
      console.log("[dashboard/auth] login-debug bcrypt.compare result=", ok);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("[dashboard/auth] login-debug bcrypt.compare threw", e);
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
    // eslint-disable-next-line no-console
    console.log("[dashboard/auth] login-debug plaintextFallback=", ok);
  }

  if (!ok) return null;
  return {
    email: user.email.trim(),
    role: user.role?.trim() || "operator",
  };
}
