# SIWAKY — Luxury Natural Oral Care

> Premium DTC store for SIWAKY (EMYRA LTD, UK) — luxury miswak for KSA & GCC.

**Live:** [siwaky.com](https://siwaky.com) · **API:** [api.siwaky.com](https://api.siwaky.com) · **Contact:** siwaky.assistance@gmail.com

---

## Stack

| Layer        | Tech                                                |
| ------------ | --------------------------------------------------- |
| Frontend     | Next.js 14 (App Router) · TypeScript · Tailwind     |
| i18n         | `next-intl` — Arabic (RTL) primary, English secondary |
| State        | Zustand (cart)                                       |
| Animation    | Framer Motion                                        |
| Backend      | FastAPI · SQLAlchemy · Alembic · Pydantic           |
| Database     | PostgreSQL                                           |
| Geo / Fraud  | MaxMind GeoIP2                                       |
| Sheets sync  | Google Apps Script webhook                          |
| Deploy       | Docker → Easypanel (push-to-deploy via GitHub)      |

## Project layout

```
siwaky/
├── frontend/        # Next.js 14 (siwaky.com)
├── backend/         # FastAPI (api.siwaky.com)
├── sheets/          # Google Apps Script + setup docs
├── docs/            # Architecture, design system, CRO, pixels, deploy
└── docker-compose.yml
```

## Quickstart (local)

```bash
# 1. Backend
cd backend
cp .env.example .env
docker compose up backend db

# 2. Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev      # http://localhost:3000

# Optional: Next.js + uvicorn together (requires Python deps / uvicorn on PATH)
# pip install -r ../backend/requirements.txt   # from backend/, ideally in a venv
npm run dev:all  # web :3000 · API :8000 (uses concurrently)

# Same script from repo root (delegates into frontend/)
cd ..
npm run dev:all
```

If `/dashboard` shows **“missing required error components”** or endless refresh in dev: stop every stray `next dev` instance, delete `frontend/.next`, run `npm run dev` once again — duplicate dev servers commonly trigger that overlay.

### Dashboard orders (`503` / “upstream unreachable”)

The dashboard loads rows via the Next proxy `GET /api/dashboard/orders`, which forwards to FastAPI **`GET /orders`** (`backend/app/main.py`). A **503** means Next could not open a TCP connection (API not running, wrong URL, or Docker networking).

- **Native dev:** In one terminal run `npm run dev --prefix backend` (listening on `http://127.0.0.1:8000`). In `.env.local` set `DASHBOARD_ORDERS_API_BASE_URL=http://127.0.0.1:8000` and **`restart `next dev`** after editing env.
- **Check:** `curl http://127.0.0.1:8000/health` should return `{ "status": "ok" }`.
- **Docker:** The Next container must use **`DASHBOARD_ORDERS_API_BASE_URL=http://backend:8000`**, not `127.0.0.1` (localhost inside the container is the container itself). This repo’s `docker-compose.yml` sets that.

Or run the entire stack at once:

```bash
docker compose up --build
```

## Docs

| Doc                                         | What it covers                                         |
| ------------------------------------------- | ------------------------------------------------------ |
| [docs/architecture.md](docs/architecture.md)   | System architecture, data flow, infra topology         |
| [docs/design-system.md](docs/design-system.md) | Brand colors, typography, components, motion           |
| [docs/cro-strategy.md](docs/cro-strategy.md)   | All CRO elements, AOV, confirmation/delivery levers    |
| [docs/copy.md](docs/copy.md)                   | All Arabic + English copy per section                  |
| [docs/pixels.md](docs/pixels.md)               | Web pixels (Meta/TikTok/Snap) + CAPI + deduplication   |
| [docs/backend-api.md](docs/backend-api.md)     | API endpoints, schemas, validation                     |
| [docs/deployment.md](docs/deployment.md)       | Easypanel deploy + DNS + CI/CD                         |

## Brand

- **Legal entity:** EMYRA LTD (UK)
- **Halal cert:** CR/IHCP/SAC/03/26/HC — valid until March 2027
- **Markets:** KSA (primary), GCC (expansion)
- **Payment:** COD only (no gateway integrated)

## License

© 2026 SIWAKY — EMYRA LTD. All rights reserved.
