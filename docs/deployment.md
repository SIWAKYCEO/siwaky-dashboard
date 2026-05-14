# SIWAKY — Deployment (Easypanel + GitHub)

> Both services deploy on **Easypanel** via GitHub push-to-deploy.
> Store PostgreSQL: use `DATABASE_URL` (see `backend/app/config.py` for the dashboard API default host).

---

## 1. Repository

Single mono-repo with two services:

```
siwaky/
├── frontend/   ← Easypanel app: "siwaky-frontend"   → siwaky.com
├── backend/    ← Easypanel app: "siwaky-backend"    → api.siwaky.com
└── docker-compose.yml  (local dev only)
```

Push to `main` triggers both deployments.

## 2. DNS

| Subdomain          | Service          |
| ------------------ | ---------------- |
| `siwaky.com`       | siwaky-frontend  |
| `www.siwaky.com`   | → 301 → siwaky.com |
| `api.siwaky.com`   | siwaky-backend   |

Easypanel will auto-provision Let's Encrypt certs once DNS points to the panel IP.

## 3. PostgreSQL

Already installed. Example connection string (adjust user/password if needed):

```
postgres://siwaky:siwaky@frontend_database:5432/siwaky?sslmode=disable
```

The main API backend's `DATABASE_URL` must reach this database. The **dashboard** FastAPI service uses `DEFAULT_DATABASE_URL` in `backend/app/config.py` when env is empty, and ignores obsolete Docker-only hostnames.

## 4. Frontend deploy

### Easypanel ↔ GitHub — verify if production never matches `main`

There is **no** Easypanel config file in git; open **Easypanel → siwaky-frontend → Source** and confirm the clone URL and paths match **how this repo is structured**:

| Where `git push` goes | Repository URL in Easypanel | Root directory / **Subdirectory** | Dockerfile path (typical) |
|-----------------------|-----------------------------|-----------------------------------|-----------------------------|
| **Monorepo** with top-level `frontend/` (this workspace layout in `docs/deployment.md`) | Mono-repo HTTPS/SSH URL | **`frontend`** (subdirectory = build context) | `Dockerfile` (file inside that folder) |
| **Frontend-only** repo (only Next.js app at repo root; no nested `frontend/` folder) | That repo URL | **`/`** or leave blank — **never** `frontend/` | `Dockerfile` or `dockerfile` at repo root |

**Common bug:** GitHub app is **`SIWAKYCEO/frontend`** but Easypanel still uses subdirectory **`frontend/`** as if it were the mono-repo → builds pull the wrong tree or never update.

**Common bug:** Easypanel wired to an **old fork** or archived repo → deploy “green” but stale bundle.

After correcting Source, run one **Rebuild without cache**.

### Which file serves `/product`

Only **`frontend/app/[locale]/(shop)/product/page.tsx`** defines the PDP. The `(shop)` segment does **not** appear in the URL. There must **not** be a second `frontend/app/[locale]/product/page.tsx` or Next.js will conflict.

### App settings (Easypanel)
- **Type:** App (Docker)
- **Source:** GitHub → branch `main`
  - **Monorepo:** subdirectory / root path **`frontend`**, Dockerfile **`Dockerfile`** (inside context).
  - **Frontend-only repo:** subdirectory **`/`** (repo root), Dockerfile **`Dockerfile`** at root.
- **Port:** `3000`
- **Domain:** `siwaky.com` (+ `www.siwaky.com` redirect)

### Env vars (Easypanel → Environment)

```
NEXT_PUBLIC_API_URL=https://api.siwaky.com
NEXT_PUBLIC_SITE_URL=https://siwaky.com
NEXT_PUBLIC_META_PIXEL_ID=1898036304185332
NEXT_PUBLIC_TIKTOK_PIXEL_ID=D722UD3C77UDBCCMEAQG
NEXT_PUBLIC_SNAP_PIXEL_ID=PLACEHOLDER_ADD_LATER
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

## 5. Backend deploy

### App settings
- **Type:** App (Docker)
- **Source:** GitHub → branch `main` → root path `backend/`
- **Dockerfile path:** `backend/Dockerfile`
- **Port:** `8000`
- **Domain:** `api.siwaky.com`

### Env vars

```
DATABASE_URL=postgres://siwaky:siwaky@frontend_database:5432/siwaky?sslmode=disable
FRONTEND_URL=https://siwaky.com
ENVIRONMENT=production
PORT=8000

# MaxMind
MAXMIND_ACCOUNT_ID=...
MAXMIND_LICENSE_KEY=...

# Meta CAPI
META_PIXEL_ID=1898036304185332
META_ACCESS_TOKEN=...

# TikTok CAPI
TIKTOK_PIXEL_ID=D722UD3C77UDBCCMEAQG
TIKTOK_ACCESS_TOKEN=...

# Snapchat CAPI
SNAP_PIXEL_ID=
SNAP_ACCESS_TOKEN=

# Google Sheets
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
SHEETS_WEBHOOK_SECRET=long-random-string
```

### Networking
The backend must be able to reach PostgreSQL on the host/port in `DATABASE_URL` (firewall / VPC).

## 6. Migrations on startup

Backend's `app/main.py` runs `alembic upgrade head` inside the `lifespan` context. No additional CI step needed.

If you ever want to disable that (e.g., for blue-green), set `ALEMBIC_AUTO_UPGRADE=0`.

## 7. Health checks

| Service  | Endpoint                                            |
| -------- | --------------------------------------------------- |
| Frontend | `GET https://siwaky.com/` → 200                     |
| Backend  | `GET https://api.siwaky.com/health` → `{"status":"ok"}` |

Easypanel can be configured to ping these on a 30s interval.

## 8. Logs

- **Backend:** structured to stdout (FastAPI default). Easypanel → Logs tab.
- **Frontend:** Next.js logs to stdout in standalone mode. Easypanel → Logs tab.

## 9. CI/CD flow

```
dev: git push origin main
     │
     ├─► GitHub webhook → Easypanel
     │       │
     │       ├─► siwaky-frontend: rebuild image (frontend/Dockerfile) → rolling deploy
     │       └─► siwaky-backend:  rebuild image (backend/Dockerfile)  → rolling deploy
     │
     └─► (no manual step required)
```

Average deploy: ~3 minutes (frontend) / ~1 minute (backend).

## 10. Manual rollback

In Easypanel → App → Deployments → click a previous build → "Redeploy".
DB migrations are forward-only — design migrations to be backward-compatible (additive columns) so rolling back the app does not break the DB.
