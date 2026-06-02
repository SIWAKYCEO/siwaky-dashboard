/**
 * Base URL of the storefront (siwaky.com) for server-side proxy calls to
 * the reviews API. The storefront stores reviews in its own data/reviews.json
 * and validates dashboard session cookies before returning admin data.
 *
 * In Docker/Easypanel: set FRONTEND_STORE_URL=http://frontend:3000
 * In local dev:        http://localhost:3000 (or whatever port the store runs on)
 */
function nonEmpty(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t || undefined;
}

export function getReviewsUpstreamBase(): string {
  const env = nonEmpty(process.env.FRONTEND_STORE_URL);
  if (env) return env.replace(/\/$/, "");
  return process.env.NODE_ENV === "production"
    ? "http://frontend:3000"
    : "http://localhost:3000";
}
