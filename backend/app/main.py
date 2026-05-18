import logging
import os

# rebuilt 2026-05-14 — GET /orders reads Google Sheets via Easypanel env (PostgreSQL used elsewhere).

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    last_database_resolution_error,
    load_settings,
    resolved_database_url,
    selected_database_source,
    selected_database_url_redacted,
)
from app.routes import push, store_orders
from app.services.orders_db import ping_database
from app.services.orders_sheets import fetch_orders_from_google_sheets
from app.services.push_notify import process_orders_for_push

logger = logging.getLogger(__name__)

app = FastAPI(title="SIWAKY Dashboard API", version="0.1.0")
app.include_router(store_orders.router)
app.include_router(push.router)

# Required CORS hosts (dashboard ↔ API in Docker / prod).
_cors_required = (
    "http://dashboard-frontend:3001",
    "https://dashboard.siwaky.com",
    "https://siwaky.com",
    "https://www.siwaky.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
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
        src = selected_database_source()
        if src:
            out["database_source"] = src
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
        "database_source": selected_database_source(),
        "last_resolution_error": last_database_resolution_error(),
        "postgres_discrete_env": {
            "POSTGRES_HOST_or_PGHOST": bool(
                (os.environ.get("POSTGRES_HOST") or os.environ.get("PGHOST") or "").strip()
            ),
        },
        "orders_endpoint_env": ["GOOGLE_SERVICE_ACCOUNT_JSON", "SIWAKY_SPREADSHEET_ID", "SIWAKY_SHEET_TAB"],
        "orders_endpoint_source": "google_sheets",
    }


@app.get("/orders")
def get_orders():
    """
    Orders for the dashboard: **Google Sheets** only — reads Easypanel env::

        GOOGLE_SERVICE_ACCOUNT_JSON
        SIWAKY_SPREADSHEET_ID
        SIWAKY_SHEET_TAB (defaults to 📦 Orders if unset)

    PostgreSQL reader remains in ``app.services.orders_db.fetch_orders_array`` for a future switch.

    After a successful read, new ``order_id`` values trigger Web Push to registered subscribers.
    """
    try:
        orders = fetch_orders_from_google_sheets()
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    try:
        process_orders_for_push(orders)
    except Exception:
        logger.exception("[push] process_orders_for_push failed — orders still returned")

    return orders
