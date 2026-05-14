/**
 * Fallback credentials when the host/Easypanel injects empty env (or docker build layers run fully cached).
 * Mirrors `dockerfile` ARG defaults — rotate together if you change secrets.
 */
export const DASHBOARD_AUTH_SECRET_FALLBACK =
  "siwaky2026dashboard_secret_key_very_long_32chars";

/** bcrypt `$` in JSON — password originally hashed for dev placeholder before prod rotation. */
export const DASHBOARD_USERS_JSON_FALLBACK = `[{"email":"siwaky.assistance@gmail.com","role":"admin","passwordHash":"$2b$12$l8XVlTD.5i5kJVKYmHxbJ.8cQBChQ/oCAEwdRiqQ8c1xOIDRXSH7C"}]`;

/** Edge-safe — used by middleware + `users.ts` (no `bcryptjs` import chain on Edge). */
export function resolvedDashboardUsersJsonRaw(): string {
  const fromEnv = process.env.DASHBOARD_USERS_JSON?.replace(/^\uFEFF/, "").trim() ?? "";
  return fromEnv || DASHBOARD_USERS_JSON_FALLBACK;
}

/** True if JSON parses to a non-empty array; Edge-safe. */
export function isDashboardUsersJsonNonEmpty(): boolean {
  const raw = resolvedDashboardUsersJsonRaw();
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}
