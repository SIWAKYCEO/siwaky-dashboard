import os

# rebuilt 2026-05-14 — orders from PostgreSQL (DATABASE_URL)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import load_settings
from app.services.orders_db import fetch_orders_array

app = FastAPI(title="SIWAKY Dashboard API", version="0.1.0")

# Required CORS hosts (dashboard ↔ API in Docker / prod).
_cors_required = (
    "http://dashboard-frontend:3001",
    "https://dashboard.siwaky.com",
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
    return {"status": "ok"}


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
    settings = load_settings()
    return {
        "database_url_configured": bool(settings.database_url.strip()),
    }


@app.get("/orders")
def get_orders():
    """
    Orders from PostgreSQL `orders` table (siwaky.com store database).
    Returns a JSON array aligned with the dashboard `OrderRow` shape.
    """
    settings = load_settings()
    if not settings.database_url.strip():
        raise HTTPException(
            status_code=500,
            detail="DATABASE_URL is not set",
        )

    try:
        return fetch_orders_array(database_url=settings.database_url)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e)) from e
