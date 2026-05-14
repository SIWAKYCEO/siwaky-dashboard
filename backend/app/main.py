from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import load_settings
from app.services.sheets import (
    extract_orders_from_sheet_rows,
    fetch_orders_as_rows,
    list_sheet_titles,
)

app = FastAPI(title="SIWAKY Dashboard API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/debug/config")
def debug_config():
    settings = load_settings()
    creds = settings.google_credentials_path.expanduser().resolve()
    return {
        "sheet_tab": settings.sheet_tab.strip(),
        "spreadsheet_id": settings.spreadsheet_id.strip(),
        "google_credentials_path_exists": creds.is_file(),
    }


@app.get("/debug/sheets")
def debug_sheets():
    settings = load_settings()
    creds = settings.google_credentials_path.expanduser().resolve()
    if not creds.is_file():
        raise HTTPException(
            status_code=500,
            detail="Credentials file not found",
        )

    spreadsheet_id = settings.spreadsheet_id.strip()
    try:
        titles = list_sheet_titles(
            credentials_path=creds,
            spreadsheet_id=spreadsheet_id,
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
    Reads the private Google Sheet using the service account and returns rows as JSON objects
    keyed by the header row.
    """
    settings = load_settings()
    creds = settings.google_credentials_path.expanduser().resolve()
    if not creds.is_file():
        raise HTTPException(
            status_code=500,
            detail=f"Credentials file not found: {creds}",
        )

    try:
        rows = fetch_orders_as_rows(
            credentials_path=creds,
            spreadsheet_id=settings.spreadsheet_id.strip(),
            sheet_tab=settings.sheet_tab.strip(),
        )
        orders = extract_orders_from_sheet_rows(rows)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

    return {"count": len(orders), "orders": orders}
