/**
 * FastAPI base URL for the dashboard `/orders` server proxy only (`app/api/dashboard/orders`).
 *
 * Do **not** use `NEXT_PUBLIC_API_URL` here: that is the public storefront API (often production HTTPS
 * via `next.config.js`) and is a different service than the internal orders bridge — using it causes
 * 502 / HTML responses and "response was not JSON" on the client.
 *
 * For local dev without env: `http://127.0.0.1:8000`. In Docker, set
 * `DASHBOARD_ORDERS_API_BASE_URL=http://backend:8000` (see `docker-compose.yml`).
 *
 * Easypanel often injects **empty strings** for unset vars — those must be treated as "unset" or they
 * override Compose defaults and break the proxy.
 */
function nonEmptyEnv(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

export function getDashboardOrdersUpstreamBase(): string {
  const fromEnv =
    nonEmptyEnv(process.env.DASHBOARD_ORDERS_API_BASE_URL) ??
    nonEmptyEnv(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://127.0.0.1:8000";
}
