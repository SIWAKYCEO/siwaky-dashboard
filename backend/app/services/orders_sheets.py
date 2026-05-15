"""Load dashboard orders from Google Sheets (same 21-column layout as ``sheets_webhook``)."""

from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import Any

from app.services.sheets_webhook import (
    SHEET_COLUMN_COUNT,
    _escape_sheet_title,
    _first_data_row,
    _spreadsheet_id,
    _tab_name,
    load_service_account_credentials,
)

logger = logging.getLogger(__name__)


def _strip_sheet_cell(v: Any) -> str:
    """Trim; drop leading ``'`` used by Sheets for text cells."""
    s = "" if v is None else str(v).strip()
    if s.startswith("'"):
        s = s[1:].strip()
    return s


def _normalize_date_display(s: str) -> str:
    """Prefer ``YYYY-MM-DD`` for dashboard parity with PostgreSQL ``GET /orders``."""
    t = s.strip()
    if not t:
        return ""
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(t, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return t


def _pad_row(cells: list[Any]) -> list[str]:
    out = [_strip_sheet_cell(cells[i]) if i < len(cells) else "" for i in range(SHEET_COLUMN_COUNT)]
    return out


def _is_probably_header(row: list[str]) -> bool:
    if len(row) < 4:
        return False
    h = row[3].strip().lower()
    return h in {"name", "nome", "الاسم"}


def _row_has_data(row: list[str]) -> bool:
    return any(x.strip() for x in row)


def fetch_orders_from_google_sheets() -> list[dict[str, str]]:
    """
    Read order rows from the configured tab and return the same list[dict] shape as
    ``orders_db.fetch_orders_array`` (dashboard ``OrderRow``).
    """
    sid = _spreadsheet_id()
    tab = _tab_name()
    creds = load_service_account_credentials()

    if not sid:
        raise ValueError("SIWAKY_SPREADSHEET_ID (or legacy GOOGLE_SHEET_ID) is not set")
    if creds is None:
        raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON or other Sheets credentials are not configured")

    first_row = _first_data_row()
    esc = _escape_sheet_title(tab)
    range_a1 = f"'{esc}'!A{first_row}:U"

    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError

    try:
        service = build("sheets", "v4", credentials=creds, cache_discovery=False)
        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=sid, range=range_a1, majorDimension="ROWS")
            .execute()
        )
    except HttpError as exc:
        logger.error(
            "[orders] source=google_sheets sheet_tab=%s range=%s Google HttpError: %s",
            tab,
            range_a1,
            exc,
        )
        raise

    raw_values = result.get("values") or []
    out: list[dict[str, str]] = []

    for cells in raw_values:
        row = _pad_row(cells)
        if not _row_has_data(row):
            continue
        if _is_probably_header(row):
            continue

        order_id = row[20] or row[0]
        if not order_id.strip():
            order_id = re.sub(r"\s+", "-", f"{row[1]}-{row[4]}-{row[8]}".strip()) or "unknown"

        date_s = _normalize_date_display(row[1])
        time_s = row[2]
        qty_s = row[8]
        price_s = row[9]

        out.append(
            {
                "order_id": order_id.strip(),
                "date": date_s,
                "time": time_s,
                "name": row[3],
                "phone": row[4],
                "city": row[5],
                "country": row[6],
                "product": row[7],
                "quantity": qty_s,
                "price_sar": price_s,
                "status": row[10],
                "confirmed": row[11],
                "delivered": row[12],
                "returned": row[13],
                "cod_fee": row[14],
                "ip_address": row[15],
                "device": row[16],
                "source": row[17],
                "campaign": row[18],
                "notes": row[19],
            }
        )

    out.reverse()

    logger.info(
        "[orders] source=google_sheets sheet_tab=%s row_count=%s spreadsheet_id=%s first_data_row=%s",
        tab,
        len(out),
        sid,
        first_row,
    )
    return out
