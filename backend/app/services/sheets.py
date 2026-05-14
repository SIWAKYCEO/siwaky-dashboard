"""Google Sheets helpers — service account JSON from env, tab `📦 Orders`, data from row 4."""

from __future__ import annotations

from typing import Any

from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES: tuple[str, ...] = ("https://www.googleapis.com/auth/spreadsheets.readonly",)

# Sheet name (exact). Quoted in A1 range for emoji / spaces.
ORDERS_SHEET_TITLE = "📦 Orders"

# Columns A–T mapped after skipping the first 3 sheet rows (data starts row 4; use range A4).
ORDER_FIELD_KEYS: tuple[str, ...] = (
    "order_id",
    "date",
    "time",
    "name",
    "phone",
    "city",
    "country",
    "product",
    "quantity",
    "price_sar",
    "status",
    "confirmed",
    "delivered",
    "returned",
    "cod_fee",
    "ip_address",
    "device",
    "source",
    "campaign",
    "notes",
)


def _build_sheets_resource(*, service_account_info: dict[str, Any]):
    creds = service_account.Credentials.from_service_account_info(
        service_account_info,
        scopes=SCOPES,
    )
    return build("sheets", "v4", credentials=creds, cache_discovery=False)


def fetch_orders_range(
    *,
    service_account_info: dict[str, Any],
    spreadsheet_id: str,
) -> list[list[str]]:
    """Read 📦 Orders from row 4 onward (first 3 rows skipped), columns A:Z."""
    service = _build_sheets_resource(service_account_info=service_account_info)
    # Quote sheet title for Google Sheets range; start at row 4.
    range_name = f"'{ORDERS_SHEET_TITLE}'!A4:Z"
    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id.strip(), range=range_name)
        .execute()
    )
    raw = result.get("values") or []
    return [_normalize_row(r) for r in raw]


def _normalize_row(raw: list[Any]) -> list[str]:
    return ["" if c is None else str(c).strip() for c in raw]


def rows_to_order_dicts(rows: list[list[str]]) -> list[dict[str, str]]:
    """Map each row to ORDER_FIELD_KEYS; pad/truncate to 20 columns; drop all-empty rows."""
    n = len(ORDER_FIELD_KEYS)
    out: list[dict[str, str]] = []
    for raw in rows:
        cells = list(raw)
        while len(cells) < n:
            cells.append("")
        if len(cells) > n:
            cells = cells[:n]
        if all(c == "" for c in cells):
            continue
        out.append({ORDER_FIELD_KEYS[i]: cells[i] for i in range(n)})
    return out


def list_sheet_titles(
    *,
    service_account_info: dict[str, Any],
    spreadsheet_id: str,
) -> list[str]:
    service = _build_sheets_resource(service_account_info=service_account_info)
    meta = (
        service.spreadsheets()
        .get(spreadsheetId=spreadsheet_id.strip(), fields="sheets.properties.title")
        .execute()
    )
    out: list[str] = []
    for sheet in meta.get("sheets") or []:
        title = sheet.get("properties", {}).get("title")
        if title is not None:
            out.append(title)
    return out

