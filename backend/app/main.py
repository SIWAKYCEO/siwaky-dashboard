import os

# rebuilt 2026-05-14 — orders from PostgreSQL (DATABASE_URL)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    last_database_resolution_error,
    load_settings,
    resolved_database_url,
    selected_database_url_redacted,
)
from app.services.orders_db import fetch_orders_array, ping_database

app = FastAPI(title="SIWAKY Dashboard API", version="0.1.0")

# Required CORS hosts (dashboard ↔ API in Docker / prod).
_cors_required = (
    "http://dashboard-frontend:3001",
    "https://dashboard.siwaky.com",
    "https://siwaky.com",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
)
_cors_extra = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
_allowed_origins = list(_cors_required)
if _cors_extra:
    _allowed_origins.extend([o.strip() for o in _cors_extra.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Liveness + database connectivity (same URL the Next.js proxy probes)."""
    url = resolved_database_url()
    if not url:
        return {
            "status": "degraded",
            "database": "error",
            "detail": last_database_resolution_error() or "Could not connect using any candidate DATABASE_URL.",
        }
    ok, err = ping_database(url)
    if ok:
        out = {"status": "ok", "database": "ok"}
        redacted = selected_database_url_redacted()
        if redacted:
            out["database_host"] = redacted
        return out
    return {"status": "degraded", "database": "error", "detail": err}


@app.get("/debug/routes")
def debug_routes():
    """Which HTTP routes exist on this process."""
    routes: list[dict[str, object]] = []
    for route in app.routes:
        path = getattr(route, "path", None)
        methods = getattr(route, "methods", None)
        if isinstance(path, str) and methods:
            m = sorted(x for x in methods if x not in ("HEAD", "OPTIONS"))
            routes.append({"path": path, "methods": m})
    return {"routes": routes}


@app.get("/debug/config")
def debug_config():
    load_settings()
    return {
        "database_resolved": bool(resolved_database_url()),
        "database_selected": selected_database_url_redacted(),
        "last_resolution_error": last_database_resolution_error(),
        "database_env_keys_present": {
            "DATABASE_URL": bool(os.environ.get("DATABASE_URL", "").strip()),
            "POSTGRES_URL": bool(os.environ.get("POSTGRES_URL", "").strip()),
            "POSTGRES_PRISMA_URL": bool(os.environ.get("POSTGRES_PRISMA_URL", "").strip()),
            "DATABASE_URL_FALLBACKS": bool(os.environ.get("DATABASE_URL_FALLBACKS", "").strip()),
        },
    }


@app.get("/orders")
def get_orders():
    """
    Orders from PostgreSQL `orders` table (siwaky.com store database).
    Returns a JSON array aligned with the dashboard `OrderRow` shape.
    """
    url = resolved_database_url()
    if not url:
        raise HTTPException(
            status_code=500,
            detail=last_database_resolution_error()
            or "DATABASE_URL — no working Postgres candidate. Set DATABASE_URL to the connection string from your Easypanel Postgres service (same project as the DB), or add DATABASE_URL_FALLBACKS=comma,separated,urls.",
        )

    try:
        return fetch_orders_array(database_url=url)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e)) from e
