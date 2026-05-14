/**
 * Fallback credentials when the host/Easypanel injects empty env (or docker build layers run fully cached).
 * Mirrors `dockerfile` ARG defaults — rotate together if you change secrets.
 */
export const DASHBOARD_AUTH_SECRET_FALLBACK =
  "siwaky2026dashboard_secret_key_very_long_32chars";

/** bcrypt `$` in JSON — password originally hashed for dev placeholder before prod rotation. */
export const DASHBOARD_USERS_JSON_FALLBACK = `[{"email":"siwaky.assistance@gmail.com","role":"admin","passwordHash":"$2b$12$l8XVlTD.5i5kJVKYmHxbJ.8cQBChQ/oCAEwdRiqQ8c1xOIDRXSH7C"}]`;
