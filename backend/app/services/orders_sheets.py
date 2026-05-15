"""Load dashboard orders from Google Sheets via Easypanel env (direct reads)."""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime
from typing import Any

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.services.sheets_webhook import (
    SHEET_COLUMN_COUNT,
    _escape_sheet_title,
    _first_data_row,
    _normalize_private_key,
)

logger = logging.getLogger(__name__)

# Explicit Easypanel keys for GET /orders (no legacy fallbacks).
_ENV_JSON = "GOOGLE_SERVICE_ACCOUNT_JSON"
_ENV_SID = "SIWAKY_SPREADSHEET_ID"
_ENV_TAB = "SIWAKY_SHEET_TAB"

_SCOPES = ("https://www.googleapis.com/auth/spreadsheets",)


def _strip_sheet_cell(v: Any) -> str:
    s = "" if v is None else str(v).strip()
    if s.startswith("'"):
        s = s[1:].strip()
    return s


def _normalize_date_display(s: str) -> str:
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
    return [_strip_sheet_cell(cells[i]) if i < len(cells) else "" for i in range(SHEET_COLUMN_COUNT)]


def _is_probably_header(row: list[str]) -> bool:
    if len(row) < 4:
        return False
    return row[3].strip().lower() in {"name", "nome", "الاسم"}


def _row_has_data(row: list[str]) -> bool:
    return any(x.strip() for x in row)


def _credentials_from_easypanel_json() -> service_account.Credentials:
    raw = os.environ.get(_ENV_JSON, "").strip()
    if not raw:
        raise ValueError(f"{_ENV_JSON} is not set or empty")

    try:
        info = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{_ENV_JSON} is not valid JSON: {exc}") from exc

    if not isinstance(info, dict):
        raise ValueError(f"{_ENV_JSON} must decode to a JSON object")

    if isinstance(info.get("private_key"), str) and "\\n" in info["private_key"]:
        info = dict(info)
        info["private_key"] = _normalize_private_key(info["private_key"])

    return service_account.Credentials.from_service_account_info(info, scopes=_SCOPES)


def fetch_orders_from_google_sheets() -> list[dict[str, str]]:
    """
    Read order rows using only:

    - ``GOOGLE_SERVICE_ACCOUNT_JSON``
    - ``SIWAKY_SPREADSHEET_ID``
    - ``SIWAKY_SHEET_TAB`` (defaults to ``📦 Orders`` if unset)

    Returns the same ``list[dict]`` shape as ``orders_db.fetch_orders_array``.
    Optional: ``GOOGLE_SHEETS_FIRST_DATA_ROW`` (via ``_first_data_row()``).
    """
    sid = os.environ.get(_ENV_SID, "").strip()
    if not sid:
        raise ValueError(f"{_ENV_SID} is not set or empty")

    tab = os.environ.get(_ENV_TAB, "").strip() or "📦 Orders"

    creds = _credentials_from_easypanel_json()
    first_row = _first_data_row()
    esc = _escape_sheet_title(tab)
    range_a1 = f"'{esc}'!A{first_row}:U"

    logger.info(
        "[orders] source=google_sheets credential_env=%s spreadsheet_env=%s tab_env=%s sheet_tab=%s first_data_row=%s",
        _ENV_JSON,
        _ENV_SID,
        _ENV_TAB,
        tab,
        first_row,
    )

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

        out.append(
            {
                "order_id": order_id.strip(),
                "date": _normalize_date_display(row[1]),
                "time": row[2],
                "name": row[3],
                "phone": row[4],
                "city": row[5],
                "country": row[6],
                "product": row[7],
                "quantity": row[8],
                "price_sar": row[9],
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
        "[orders] source=google_sheets row_count=%s sheet_tab=%s spreadsheet_id=%s",
        len(out),
        tab,
        sid,
    )
    return out
