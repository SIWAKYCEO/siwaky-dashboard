/**
 * Direct PostgreSQL connection for reviews — eliminates the storefront proxy.
 * Both apps (storefront + dashboard) connect to the same DATABASE_URL.
 *
 * The client is created lazily (inside getSql()) so that importing this module
 * at build time does NOT throw when DATABASE_URL is not yet set.
 */
import postgres from "postgres";

export type DbReview = {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  image_url: string | null;
  approved: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

function makeSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured on the dashboard service");
  return postgres(url, {
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
    max: 5,
    idle_timeout: 30,
    connect_timeout: 10,
    transform: { undefined: null },
  });
}

// Lazy singleton — created on first request, never at import/build time.
const g = globalThis as typeof globalThis & { _dashReviewsSql?: ReturnType<typeof makeSql> };

export function getSql(): ReturnType<typeof makeSql> {
  if (!g._dashReviewsSql) {
    g._dashReviewsSql = makeSql();
  }
  return g._dashReviewsSql;
}

let ensured = false;
export async function ensureTable(): Promise<void> {
  if (ensured) return;
  const sql = getSql();
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      name       VARCHAR(100) NOT NULL,
      city       VARCHAR(100) NOT NULL,
      rating     INTEGER      NOT NULL CHECK (rating BETWEEN 1 AND 5),
      text       TEXT         NOT NULL,
      image_url  VARCHAR(500),
      approved   BOOLEAN      NOT NULL DEFAULT false,
      status     VARCHAR(20)  NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;
  ensured = true;
}
