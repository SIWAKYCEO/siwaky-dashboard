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

function upstreamBaseFallback(): string {
  // Easypanel / Compose: frontend container must reach the FastAPI service, not localhost.
  if (process.env.NODE_ENV === "production") {
    return "http://backend:8000";
  }
  return "http://127.0.0.1:8000";
}

/** Human-readable hint for debugging (never contains credentials). */
function describeUpstreamCandidate(label: string, value: string | undefined): string {
  try {
    if (!value) return `${label}=(empty)`;
    const u = new URL(value.includes("://") ? value : `http://${value}`);
    return `${label}=${u.protocol}//${u.host}`;
  } catch {
    return `${label}=(unparseable)`;
  }
}

export function getDashboardOrdersUpstreamBase(): string {
  const primary = nonEmptyEnv(process.env.DASHBOARD_ORDERS_API_BASE_URL);
  const fallbackEnv =
    nonEmptyEnv(process.env.ORDERS_BACKEND_INTERNAL_URL) ?? nonEmptyEnv(process.env.NEXT_PUBLIC_API_BASE_URL);

  const fromEnv = primary ?? fallbackEnv;

  if (fromEnv) {
    const normalized = fromEnv.replace(/\/$/, "");
    console.log("[siwaky/orders-upstream] resolved FastAPI base (dashboard GET + checkout POST proxy)", {
      source: primary ? "DASHBOARD_ORDERS_API_BASE_URL" : "fallback_ENV_CHAIN",
      target: describeUpstreamCandidate("resolved", normalized),
      usingPublicApiFallback: !primary && Boolean(fallbackEnv),
    });
    if (!primary && fallbackEnv) {
      console.warn(
        "[siwaky/orders-upstream] Prefer DASHBOARD_ORDERS_API_BASE_URL=http://backend:8000 for internal Compose/Easypanel routing.",
      );
    }
    return normalized;
  }

  const resolved = upstreamBaseFallback();
  console.warn(
    "[siwaky/orders-upstream] Missing DASHBOARD_ORDERS_API_BASE_URL — using NODE_ENV fallback",
    {
      nodeEnv: process.env.NODE_ENV,
      resolved: describeUpstreamCandidate("fallback", resolved),
      candidates: describeUpstreamCandidate("DASHBOARD_ORDERS_API_BASE_URL", process.env.DASHBOARD_ORDERS_API_BASE_URL),
    },
  );
  return resolved;
}
