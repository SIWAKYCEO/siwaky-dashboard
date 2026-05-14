import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import load_settings
from app.services.sheets import (
    fetch_orders_range,
    list_sheet_titles,
    rows_to_order_dicts,
)

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
    json_set = bool(settings.google_service_account_json.strip())
    sid = settings.google_sheets_spreadsheet_id.strip()
    return {
        "google_service_account_json_configured": json_set,
        "google_sheets_spreadsheet_id_configured": bool(sid),
        "sheet_name": "📦 Orders",
    }


@app.get("/debug/sheets")
def debug_sheets():
    settings = load_settings()
    if not settings.google_service_account_json.strip():
        raise HTTPException(status_code=500, detail="GOOGLE_SERVICE_ACCOUNT_JSON is not set")
    if not settings.google_sheets_spreadsheet_id.strip():
        raise HTTPException(status_code=500, detail="GOOGLE_SHEETS_SPREADSHEET_ID is not set")
    try:
        info = settings.service_account_info()
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    try:
        titles = list_sheet_titles(
            service_account_info=info,
            spreadsheet_id=settings.google_sheets_spreadsheet_id,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to read spreadsheet metadata: {exc}",
        ) from exc

    return {"sheet_titles": titles}


@app.get("/orders")
def get_orders():
    """
    Read tab **📦 Orders** (skip first 3 rows; data from row 4, columns A–T).
    Returns a JSON array of order objects.
    """
    settings = load_settings()
    if not settings.google_service_account_json.strip():
        raise HTTPException(status_code=500, detail="GOOGLE_SERVICE_ACCOUNT_JSON is not set")
    if not settings.google_sheets_spreadsheet_id.strip():
        raise HTTPException(status_code=500, detail="GOOGLE_SHEETS_SPREADSHEET_ID is not set")

    try:
        info = settings.service_account_info()
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    try:
        rows = fetch_orders_range(
            service_account_info=info,
            spreadsheet_id=settings.google_sheets_spreadsheet_id,
        )
        orders = rows_to_order_dicts(rows)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e)) from e

    return orders
