# SIWAKY — System Architecture

## 1. High-level topology

```
                                ┌────────────────────┐
                                │   TikTok / Meta /  │
                                │   Snapchat ads     │
                                └──────────┬─────────┘
                                           │ (traffic)
                                           ▼
┌────────────────────────────────────────────────────────────────────┐
│                       siwaky.com (Next.js 14)                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  RTL Arabic UI · Zustand cart · Framer Motion · next-intl   │  │
│  │  Deferred web pixels (Meta · TikTok · Snap)                  │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
└───────────────────────────┼────────────────────────────────────────┘
                            │ HTTPS (axios)
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│                  api.siwaky.com (FastAPI · Uvicorn)                │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────────┐   │
│  │ /api/geo   │  │ /api/orders│  │ /api/capi/* (server-side)  │   │
│  └─────┬──────┘  └──────┬─────┘  └──────────────┬─────────────┘   │
│        │                │                       │                  │
│        ▼                ▼                       ▼                  │
│  ┌──────────┐    ┌──────────────┐     ┌────────────────────┐      │
│  │ MaxMind  │    │  PostgreSQL  │     │  Meta · TikTok ·   │      │
│  │ GeoIP2   │    │  (orders)    │     │  Snap CAPI         │      │
│  └──────────┘    └──────┬───────┘     └────────────────────┘      │
│                         │                                          │
│                         ▼                                          │
│                  ┌────────────────┐                                │
│                  │ Google Apps    │                                │
│                  │ Script Webhook │ ──► Google Sheets (Orders)     │
│                  └────────────────┘                                │
└────────────────────────────────────────────────────────────────────┘
```

## 2. Hosts

| Host                                    | Role                       | Domain               |
| --------------------------------------- | -------------------------- | -------------------- |
| Easypanel (frontend)                    | Next.js standalone build   | `siwaky.com`         |
| Easypanel (backend)                     | FastAPI/Uvicorn            | `api.siwaky.com`     |
| Easypanel (postgres `siwaky_database`)  | PostgreSQL 16              | internal             |
| MaxMind                                 | GeoIP / fraud detection    | hosted               |
| Google Sheets                           | Operations / fulfillment   | hosted               |

## 3. Order flow

1. Customer clicks **"اطلب الآن"** on product page → adds to cart (Zustand).
2. Opens **CartDrawer** → "أتمم الطلب" → opens **CheckoutPopup**.
3. Frontend posts `{ name, phone, offer, source, event_id }` to `POST /api/orders`.
4. Backend:
   - Validates phone (KSA regex) + name length.
   - Calls **GeoIP2 Insights** with client IP → reject if not `SA`, VPN, or risk > 50.
     - Whitelist phone `0550000000` for QA.
   - Persists row in `orders` table (`pending`).
   - Fires **Google Sheets webhook** (Apps Script) — non-blocking.
   - Fires **server-side CAPI** for Meta + TikTok + Snap with the same `event_id` (dedup).
5. Frontend redirects to `/thank-you` → fires web-pixel `Purchase` (same `event_id`).
6. Ops team confirms order from Google Sheet → call center contacts customer.

## 4. Frontend

- **App Router** with `/[locale]/...` segments. `ar` (default) and `en`.
- `middleware.ts` redirects `/` → `/ar`.
- **i18n:** `next-intl` with JSON message catalogs in `messages/{ar,en}.json`.
- **Layouts** set `dir="rtl"` for `ar` and `dir="ltr"` for `en`. Fonts swap accordingly:
  - Arabic display: **Scheherazade New** (large headlines).
  - Arabic body: **Noto Naskh Arabic**.
  - Latin: **Cormorant Garamond**.
- **Cart state:** Zustand with `persist` middleware (localStorage).
- **Pixels:** Loaded **after `window.load` + 2s** to keep LCP fast. All events carry a shared `event_id` (UUID) for dedup with backend CAPI.

## 5. Backend

- **FastAPI** with lifespan-based startup that runs `alembic upgrade head` automatically.
- **CORS:** open to `FRONTEND_URL` (and `localhost` in dev).
- **Routes:**
  - `GET  /health` — liveness.
  - `GET  /api/geo/check` — geo + fraud validation.
  - `POST /api/orders` — create order; orchestrates geo + sheets + CAPI.
  - `GET  /api/orders/{order_id}` — fetch a single order (internal).
- **Services:**
  - `geo_check.py` — MaxMind GeoIP2 wrapper with KSA/VPN/risk rules + test-phone bypass.
  - `sheets_webhook.py` — POSTs JSON to Apps Script `doPost` endpoint.
  - `pixels_capi.py` — Meta / TikTok / Snapchat CAPI with SHA-256 hashing and `event_id` dedup.

## 6. Data model

See [`docs/backend-api.md`](backend-api.md) for full DDL.

## 7. Security & fraud

- Phone validated against KSA regex (`^(05|5)(5|0|3|6|4|9|1|8|7)[0-9]{7}$`).
- IP geo-checked via **MaxMind Insights** (`is_anonymous_proxy`, `is_vpn`, `risk_score`).
- Whitelist phone `0550000000` always passes (for ad QA / pixel testing).
- No payment data ever collected — COD only.
- Sensitive env vars never shipped to the client (only `NEXT_PUBLIC_*` is exposed).
- CAPI calls hash PII (email/phone/name) with SHA-256 before transit.

## 8. Observability

- FastAPI `/health` for uptime checks.
- Each order row gets `event_id`, `ip_address`, `user_agent`, `source`, `campaign` for attribution debugging.
- Google Sheet doubles as the operations dashboard: status, confirmed, delivered, returned, COD fee.

## 9. CI/CD

- GitHub → Easypanel auto-deploy on `main` push for both services.
- Backend Docker image runs Alembic migrations on container start (idempotent).
- Frontend uses Next.js **standalone** output for tiny production images.
