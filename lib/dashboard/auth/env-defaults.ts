/**
 * Fallback when Easypanel omits env at build/runtime. Only non-sensitive identifiers here;
 * admin password stays in server-only `users.ts` + Docker `ENV`.
 */
export const DASHBOARD_AUTH_SECRET_FALLBACK =
  "siwaky2026dashboard_secret_key_very_long_32chars";
