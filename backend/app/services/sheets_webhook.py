"""Send every confirmed order to Google Sheets.

Credentials (preferred order):

1. ``GOOGLE_SERVICE_ACCOUNT_JSON`` — parse inline service-account JSON from the environment
2. ``SIWAKY_GOOGLE_CREDENTIALS_PATH`` — filesystem path to a service-account JSON file
3. Legacy ``GOOGLE_SERVICE_ACCOUNT_EMAIL`` + ``GOOGLE_PRIVATE_KEY``
4. Legacy settings JSON + ``GOOGLE_APPLICATION_CREDENTIALS``

Spreadsheet: ``SIWAKY_SPREADSHEET_ID`` + ``SIWAKY_SHEET_TAB`` (then older ``GOOGLE_*`` vars).

Fallback: Apps Script ``doPost`` webhook with browser-like headers.
"""

from __future__ import annotations

import asyncio
import json
import logging
import math
import os
import re
import traceback
from datetime import datetime
from typing import Any, Optional
from urllib.parse import urljoin, urlparse
from zoneinfo import ZoneInfo

import httpx

from app.models.order import Order

logger = logging.getLogger("siwaky.sheets")


def _sett_str(attr: str, default: str = "") -> str:
    """Safely read optional app settings (PostgreSQL/dashboard config may not define every Sheets field)."""
    try:
        from app import config as cfg_mod

        s = getattr(cfg_mod, "settings", None)
        if s is None:
            return default
        v = getattr(s, attr, None)
        if isinstance(v, str):
            t = v.strip()
            return t if t else default
        return default
    except Exception:
        return default


def _sett_int(attr: str, default: int) -> int:
    try:
        from app import config as cfg_mod

        s = getattr(cfg_mod, "settings", None)
        if s is None:
            return default
        v = getattr(s, attr, None)
        if isinstance(v, int):
            return v
        if isinstance(v, str) and v.strip():
            return int(v.strip())
        return default
    except Exception:
        return default


_MAX_REDIRECT_HOPS = 14
_RESPONSE_LOG_MAX_CHARS = 8000

_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Sheet columns (A–U, 21): #, Date, Time, Name, Phone, City, Country, Product, Qty,
# Price SAR, Status, Confirmed, Delivered, Returned, COD Fee, IP Address, Device,
# Source, Campaign, Notes, Order ID
# Rows 1–2 layout; row 3 headers — append inserts the next data row only (via API insert).
_ROME_TZ = ZoneInfo("Europe/Rome")
SHEET_COLUMN_COUNT = 21


def _sheet_date_time_strings() -> tuple[str, str]:
    """DD/MM/YYYY and HH:MM:SS (Europe/Rome), always plain strings."""
    now = datetime.now(_ROME_TZ)
    return now.strftime("%d/%m/%Y"), now.strftime("%H:%M:%S")


def _sheet_literal_text(value: Optional[Any]) -> str:
    """
    Force Google Sheets to keep a user-typed string (USER_ENTERED) as text, not a serial date/number.
    Leading apostrophe is the standard Sheets text escape and is not shown in the cell.
    """
    s = "" if value is None else str(value).strip()
    if not s:
        return ""
    return "'" + s


def _sheet_str(value: Optional[Any]) -> str:
    """Always a trimmed string cell (JSON / Sheet); never pass bare numeric for IPs/phones."""
    return "" if value is None else str(value).strip()


def _order_source_label(order: Order) -> str:
    raw = (getattr(order, "source", None) or "") if order is not None else ""
    s = raw.strip() if isinstance(raw, str) else ""
    return s if s else "Website"


def _order_campaign_label(order: Order) -> str:
    raw = (getattr(order, "campaign", None) or "") if order is not None else ""
    return raw.strip() if isinstance(raw, str) else ""


def _order_status_label(order: Order) -> str:
    raw = (getattr(order, "status", None) or "") if order is not None else ""
    s = raw.strip() if isinstance(raw, str) else ""
    return s if s else "Pending"


def _normalize_private_key(key: str) -> str:
    """Easypanel often stores PEM as one line with ``\\n`` escapes — like JS ``.replace(/\\\\n/g, '\\n')``."""
    if not isinstance(key, str):
        return ""
    k = key.strip()
    if (k.startswith('"') and k.endswith('"')) or (k.startswith("'") and k.endswith("'")):
        k = k[1:-1].strip()
    if "\\n" in k:
        k = k.replace("\\n", "\n")
    return k


def _sheets_secret() -> str:
    v = os.environ.get("SHEETS_WEBHOOK_SECRET") or _sett_str("sheets_webhook_secret") or ""
    return (v.strip() if isinstance(v, str) else "")


def _sheets_webhook_url() -> str:
    return (os.environ.get("SHEETS_WEBHOOK_URL") or _sett_str("sheets_webhook_url") or "").strip()


def _spreadsheet_id() -> str:
    """``SIWAKY_SPREADSHEET_ID`` wins over legacy ``GOOGLE_*`` spreadsheet env keys."""
    for candidate in (
        os.environ.get("SIWAKY_SPREADSHEET_ID"),
        os.environ.get("GOOGLE_SHEET_ID"),
        os.environ.get("GOOGLE_SHEETS_SPREADSHEET_ID"),
        _sett_str("google_sheet_id"),
        _sett_str("google_sheets_spreadsheet_id"),
    ):
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    return ""


def _tab_name() -> str:
    raw = (
        os.environ.get("SIWAKY_SHEET_TAB")
        or os.environ.get("GOOGLE_SHEET_TAB_NAME")
        or os.environ.get("GOOGLE_SHEETS_TAB_NAME")
        or _sett_str("google_sheets_tab_name", "Sheet1")
    )
    if isinstance(raw, str) and raw.strip():
        return raw.strip()
    return "Sheet1"


def _service_account_email_from_env() -> str:
    return (
        os.environ.get("GOOGLE_SERVICE_ACCOUNT_EMAIL") or _sett_str("google_service_account_email") or ""
    ).strip()


def _private_key_from_env() -> str:
    return _normalize_private_key(
        os.environ.get("GOOGLE_PRIVATE_KEY") or _sett_str("google_private_key") or ""
    )


def _project_id_for_sa() -> str:
    return (
        os.environ.get("GOOGLE_PROJECT_ID") or _sett_str("google_project_id") or "easypanel-sheets"
    ).strip()


def _site_origin_referer() -> tuple[str, str]:
    raw = os.environ.get("FRONTEND_URL") or _sett_str("frontend_url") or "https://siwaky.com"
    p = urlparse(raw.strip())
    if p.scheme and p.netloc:
        origin = f"{p.scheme}://{p.netloc}"
        return origin, origin.rstrip("/") + "/"
    return "https://siwaky.com", "https://siwaky.com/"


def _webhook_headers_httpx() -> dict[str, str]:
    origin, referer = _site_origin_referer()
    return {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": _BROWSER_UA,
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": origin,
        "Referer": referer,
    }


def _webhook_headers_curl(content_length: int) -> dict[str, str]:
    h = _webhook_headers_httpx()
    h["Content-Length"] = str(content_length)
    return h


def _escape_sheet_title(tab: str) -> str:
    return tab.replace("'", "''")


def _append_range_a1(tab: str) -> str:
    return f"'{_escape_sheet_title(tab)}'!A:U"


def _first_data_row() -> int:
    """First spreadsheet row containing order data (after title + header rows)."""
    raw = (os.environ.get("GOOGLE_SHEETS_FIRST_DATA_ROW") or "").strip()
    if raw:
        try:
            return max(1, int(raw))
        except ValueError:
            logger.warning(
                "GOOGLE_SHEETS_FIRST_DATA_ROW invalid (%r); falling back to settings",
                raw,
            )
    return max(1, _sett_int("google_sheets_first_data_row", 4))


def _parse_order_index_cell(v: Any) -> Optional[int]:
    """Return a positive integer from col A (#) or None for blanks / headers / non-numeric text."""
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            return None
        x = float(v)
        if abs(x - round(x)) > 1e-9:
            return None
        n = int(round(x))
        return n if n >= 1 else None
    s = str(v).strip()
    if not s:
        return None
    slug = s.lstrip("#＃").strip()
    if not slug or slug.lower() in {"#", "n", "no", "-"}:
        return None
    try:
        x = float(slug.replace(",", ".").replace(" ", "").replace("\u00a0", ""))
        if abs(x - round(x)) > 1e-9:
            return None
        n = int(round(x))
        return n if n >= 1 else None
    except ValueError:
        return None


def _column_a_fetch_max_order(
    service: Any,
    spreadsheet_id: str,
    tab: str,
    first_data_row: int,
) -> tuple[int, int, int, list[list[Any]]]:
    """
    Read column A from ``first_data_row`` downward.
    Returns (next_order_number, max_existing_order_number, last_row_with_valid_index, raw_values).
    ``last_row_with_valid_index`` is the sheet row index (1-based) of the last row that contained
    a valid order # while scanning top-to-bottom; 0 if none.
    """
    esc = _escape_sheet_title(tab)
    range_a1 = f"'{esc}'!A{first_data_row}:A"

    from googleapiclient.errors import HttpError

    logger.info(
        "[sheets] Google Sheets FETCH starting values.get spreadsheet_id=%s tab=%s range=%s",
        spreadsheet_id,
        tab,
        range_a1,
    )
    try:
        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=spreadsheet_id, range=range_a1, majorDimension="ROWS")
            .execute()
        )
    except HttpError:
        logger.error(
            "[sheets] Google Sheets FETCH FAILURE (values.get) spreadsheet_id=%s tab=%s range=%s",
            spreadsheet_id,
            tab,
            range_a1,
        )
        raise
    values = result.get("values") or []
    logger.info(
        "[sheets] Google Sheets FETCH SUCCESS spreadsheet_id=%s tab=%s column_a_segments=%s",
        spreadsheet_id,
        tab,
        len(values),
    )
    max_order = 0
    last_sheet_row_valid = 0
    for i, row in enumerate(values):
        if not row:
            continue
        n = _parse_order_index_cell(row[0])
        if n is None:
            continue
        sheet_row = first_data_row + i
        if n >= max_order:
            max_order = n
            last_sheet_row_valid = sheet_row

    next_num = max_order + 1 if max_order > 0 else 1
    return next_num, max_order, last_sheet_row_valid, values


def _parse_inserted_start_row_from_updated_range(updated_range: Optional[str]) -> Optional[int]:
    if not updated_range or not isinstance(updated_range, str):
        return None
    m = re.search(r"!A(\d+)", updated_range, flags=re.IGNORECASE)
    if not m:
        return None
    try:
        return int(m.group(1))
    except ValueError:
        return None


def _sheet_gid_by_title(service: Any, spreadsheet_id: str, tab: str) -> int:
    meta = (
        service.spreadsheets()
        .get(spreadsheetId=spreadsheet_id, fields="sheets(properties(sheetId,title))")
        .execute()
    )
    for sh in meta.get("sheets") or []:
        props = sh.get("properties") or {}
        if props.get("title") == tab:
            return int(props["sheetId"])
    raise RuntimeError(f"Google Sheet tab not found (title mismatch): {tab!r}")


def _copy_row_format_above(
    service: Any,
    spreadsheet_id: str,
    sheet_gid: int,
    *,
    source_row_1based: int,
    dest_row_1based: int,
    num_cols: int = SHEET_COLUMN_COUNT,
) -> None:
    if source_row_1based < 1 or dest_row_1based < 1:
        raise ValueError("row indices must be >= 1")
    s0 = source_row_1based - 1
    d0 = dest_row_1based - 1
    if s0 == d0:
        return
    body = {
        "requests": [
            {
                "copyPaste": {
                    "source": {
                        "sheetId": sheet_gid,
                        "startRowIndex": s0,
                        "endRowIndex": s0 + 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": num_cols,
                    },
                    "destination": {
                        "sheetId": sheet_gid,
                        "startRowIndex": d0,
                        "endRowIndex": d0 + 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": num_cols,
                    },
                    "pasteType": "PASTE_FORMAT",
                    "pasteOrientation": "NORMAL",
                }
            }
        ]
    }
    service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()


def _credentials_source_label() -> str:
    """Which credential path would be used — for logs only (no secret material)."""
    if os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip():
        return "GOOGLE_SERVICE_ACCOUNT_JSON"
    siwaky = os.environ.get("SIWAKY_GOOGLE_CREDENTIALS_PATH", "").strip()
    if siwaky:
        return f"SIWAKY_GOOGLE_CREDENTIALS_PATH:{siwaky}"
    if _service_account_email_from_env() and _private_key_from_env():
        return "GOOGLE_SERVICE_ACCOUNT_EMAIL+GOOGLE_PRIVATE_KEY"
    if _sett_str("google_service_account_json", "").strip():
        return "settings.google_service_account_json"
    gac = (os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()
    if gac and os.path.isfile(gac):
        return f"GOOGLE_APPLICATION_CREDENTIALS:{gac}"
    return "none"


_google_sheets_bootstrap_logged = False


def _log_google_sheets_bootstrap_once() -> None:
    """Emit once-per-process spreadsheet + credential resolution for ops logs."""
    global _google_sheets_bootstrap_logged
    if _google_sheets_bootstrap_logged:
        return
    _google_sheets_bootstrap_logged = True

    sid = _spreadsheet_id()
    tab = _tab_name()
    cred_src = _credentials_source_label()
    logger.info(
        "[sheets] Google Sheets bootstrap: spreadsheet_id_loaded=%s sheet_tab_loaded=%s credentials_source=%s",
        sid or "<unset>",
        tab,
        cred_src,
    )


def _service_account_email_for_log(creds: Any) -> str:
    if creds is None:
        emails = _service_account_email_from_env()
        return emails or "<unknown>"
    try:
        sa_email = getattr(creds, "service_account_email", None)
        if isinstance(sa_email, str) and sa_email:
            return sa_email
    except Exception:
        pass
    return _service_account_email_from_env() or "<unknown>"


def load_service_account_credentials() -> Any:
    """
    Build Google credentials:

    1. ``GOOGLE_SERVICE_ACCOUNT_JSON`` — inline JSON in environment
    2. ``SIWAKY_GOOGLE_CREDENTIALS_PATH`` — JSON key file path
    3. ``GOOGLE_SERVICE_ACCOUNT_EMAIL`` + ``GOOGLE_PRIVATE_KEY``
    4. Pydantic / ``google_service_account_json`` from settings (.env)
    5. ``GOOGLE_APPLICATION_CREDENTIALS`` file path
    """
    from google.oauth2 import service_account

    scopes = ("https://www.googleapis.com/auth/spreadsheets",)

    def _creds_from_dict(info_in: dict[str, Any], source_label: str) -> Any:
        info = dict(info_in)
        if isinstance(info.get("private_key"), str) and "\\n" in info["private_key"]:
            info["private_key"] = _normalize_private_key(info["private_key"])
        try:
            c = service_account.Credentials.from_service_account_info(info, scopes=scopes)
            logger.info("[sheets] Google credentials loaded successfully (%s)", source_label)
            return c
        except Exception as exc:
            logger.error(
                "[sheets] Google credentials FAILED to build (%s): %s",
                source_label,
                exc,
                exc_info=True,
            )
            return None

    env_json_raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
    if env_json_raw:
        try:
            parsed = json.loads(env_json_raw)
        except json.JSONDecodeError as exc:
            logger.error("[sheets] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON: %s", exc)
            return None
        if not isinstance(parsed, dict):
            logger.error("[sheets] GOOGLE_SERVICE_ACCOUNT_JSON must be a JSON object")
            return None
        logger.info("[sheets] Using credentials source: GOOGLE_SERVICE_ACCOUNT_JSON (environment)")
        return _creds_from_dict(parsed, "GOOGLE_SERVICE_ACCOUNT_JSON")

    siwaky_path = os.environ.get("SIWAKY_GOOGLE_CREDENTIALS_PATH", "").strip()
    if siwaky_path:
        if not os.path.isfile(siwaky_path):
            logger.error(
                "[sheets] SIWAKY_GOOGLE_CREDENTIALS_PATH is set but not a readable file: %s",
                siwaky_path,
            )
            return None
        try:
            logger.info("[sheets] Using credentials source: SIWAKY_GOOGLE_CREDENTIALS_PATH file")
            cred = service_account.Credentials.from_service_account_file(siwaky_path, scopes=scopes)
            logger.info("[sheets] Google credentials loaded successfully (SIWAKY_GOOGLE_CREDENTIALS_PATH)")
            return cred
        except Exception as exc:
            logger.error(
                "[sheets] FAILED loading SIWAKY_GOOGLE_CREDENTIALS_PATH=%s — %s",
                siwaky_path,
                exc,
                exc_info=True,
            )
            return None

    email = _service_account_email_from_env()
    pk = _private_key_from_env()
    if email and pk:
        info = {
            "type": "service_account",
            "project_id": _project_id_for_sa(),
            "private_key_id": (os.environ.get("GOOGLE_PRIVATE_KEY_ID") or "easypanel-key").strip(),
            "private_key": pk,
            "client_email": email,
            "client_id": (os.environ.get("GOOGLE_CLIENT_ID") or "").strip(),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        logger.info("[sheets] Using credentials source: GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY")
        return _creds_from_dict(info, "GOOGLE_SERVICE_ACCOUNT_EMAIL+GOOGLE_PRIVATE_KEY")

    settings_json = _sett_str("google_service_account_json", "").strip()
    if settings_json:
        try:
            sd = json.loads(settings_json)
        except json.JSONDecodeError as exc:
            logger.error("[sheets] settings.google_service_account_json is not valid JSON: %s", exc)
            return None
        if not isinstance(sd, dict):
            return None
        logger.info("[sheets] Using credentials source: google_service_account_json (.env / settings)")
        return _creds_from_dict(sd, "settings.google_service_account_json")

    gac = (os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()
    if gac and os.path.isfile(gac):
        try:
            logger.info("[sheets] Using credentials source: GOOGLE_APPLICATION_CREDENTIALS file")
            cred = service_account.Credentials.from_service_account_file(gac, scopes=scopes)
            logger.info("[sheets] Google credentials loaded successfully (GOOGLE_APPLICATION_CREDENTIALS)")
            return cred
        except Exception as exc:
            logger.error(
                "[sheets] FAILED loading GOOGLE_APPLICATION_CREDENTIALS=%s — %s",
                gac,
                exc,
                exc_info=True,
            )
            return None

    logger.warning("[sheets] No Google service-account credentials resolved (configure env vars per module doc)")
    return None


def sheets_api_configured() -> bool:
    return bool(_spreadsheet_id()) and load_service_account_credentials() is not None


def log_sheets_config(*, context: str, order_id: str) -> None:
    _log_google_sheets_bootstrap_once()
    sid = _spreadsheet_id()
    tab = _tab_name()
    creds = load_service_account_credentials()
    email = _service_account_email_for_log(creds)
    src = _credentials_source_label()
    pk_set = bool(_private_key_from_env()) or bool(os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()) or bool(
        _sett_str("google_service_account_json", "").strip()
    )
    ga_path = (os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()
    siwaky_cred_path = (os.environ.get("SIWAKY_GOOGLE_CREDENTIALS_PATH") or "").strip()
    has_json_key_file = bool(
        (ga_path and os.path.isfile(ga_path)) or (siwaky_cred_path and os.path.isfile(siwaky_cred_path))
    )
    logger.info(
        "sheets CONFIG [%s] order=%s spreadsheet_id=%s sheet_tab=%s service_account_email=%s "
        "credentials_source_hint=%s has_inline_or_settings_private_key_material=%s has_sa_json_file=%s",
        context,
        order_id,
        sid or "<missing>",
        tab,
        email,
        src,
        "yes" if pk_set else "no",
        "yes" if has_json_key_file else "no",
    )


def sheets_exception_payload(exc: Exception) -> dict[str, Any]:
    """Serializable details for API responses + logs (never includes private key)."""
    out: dict[str, Any] = {
        "error_type": type(exc).__name__,
        "error_message": str(exc),
    }
    try:
        from googleapiclient.errors import HttpError

        if isinstance(exc, HttpError):
            out["google_http_status"] = getattr(exc.resp, "status", None) if getattr(exc, "resp", None) else None
            body = getattr(exc, "content", None) or b""
            if isinstance(body, bytes):
                try:
                    out["google_response_body"] = body.decode("utf-8", errors="replace")
                except Exception:
                    out["google_response_body"] = repr(body)
            details = getattr(exc, "error_details", None)
            if details:
                out["google_error_details"] = details
    except Exception:
        pass
    out["traceback"] = traceback.format_exc()
    return out


def _clip_response_body(text: str) -> str:
    s = text.strip()
    if len(s) <= _RESPONSE_LOG_MAX_CHARS:
        return s
    return s[: _RESPONSE_LOG_MAX_CHARS] + f"... <truncated, total_chars={len(s)}>"


def _log_http_error(*, order_id: str, exc: Any) -> None:
    try:
        from googleapiclient.errors import HttpError

        if not isinstance(exc, HttpError):
            logger.error("sheets API error (non-HttpError) order=%s: %s", order_id, exc, exc_info=True)
            return
        status = exc.resp.status if exc.resp else None
        reason = getattr(exc.resp, "reason", None) if exc.resp else None
        body = ""
        raw = getattr(exc, "content", None)
        if isinstance(raw, bytes):
            body = raw.decode("utf-8", errors="replace")
        logger.error(
            "Google Sheets API HttpError order=%s http_status=%s reason=%s response_body=%s repr=%s",
            order_id,
            status,
            reason,
            _clip_response_body(body) if body else "<empty>",
            str(exc),
        )
        if getattr(exc, "error_details", None):
            logger.error(
                "Google Sheets API error_details order=%s details=%s",
                order_id,
                exc.error_details,
            )
    except Exception:
        logger.error("sheets API HttpError (logging failed) order=%s", order_id, exc_info=True)


def append_row_values_sync(order_id: str, row_values: list[Any]) -> dict[str, Any]:
    """
    Append one row (21 values A–U) at the bottom via ``INSERT_ROWS``.
    Computes the next ``#`` from column A (ignoring blanks and rows above the configured
    first data row), sets ``row[0]``, then copies cell formatting from the row above
    (or from the header row if this is the first data row).
    Returns the Google API ``append`` response dict. Raises on append transport/HTTP errors.
    """
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError

    sid = _spreadsheet_id()
    tab = _tab_name()
    creds = load_service_account_credentials()
    first_data_row = _first_data_row()
    log_sheets_config(context="append_row_values_sync", order_id=order_id)

    if not sid or not creds:
        msg = (
            f"Sheets API not configured: spreadsheet_id={'set' if sid else 'MISSING'}, "
            f"credentials={'ok' if creds else 'MISSING'} — set SIWAKY_SPREADSHEET_ID + SIWAKY_SHEET_TAB, "
            "GOOGLE_SERVICE_ACCOUNT_JSON (recommended) or SIWAKY_GOOGLE_CREDENTIALS_PATH, "
            "or legacy GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY "
            "(share the Sheet as Editor with the service account email)."
        )
        logger.error("sheets %s", msg)
        raise RuntimeError(msg)

    row = list(row_values)
    ncols = SHEET_COLUMN_COUNT
    if len(row) < ncols:
        logger.warning(
            "sheets order=%s expected %s columns, got %s — padding trailing cells",
            order_id,
            ncols,
            len(row),
        )
        row.extend([""] * (ncols - len(row)))
    else:
        row = row[:ncols]

    service = build("sheets", "v4", credentials=creds, cache_discovery=False)

    try:
        next_order_number, max_existing_order, last_row_valid_index, col_a_vals = _column_a_fetch_max_order(
            service, sid, tab, first_data_row
        )
    except HttpError as exc:
        _log_http_error(order_id=order_id, exc=exc)
        raise

    row[0] = int(next_order_number)
    inferred_last_sheet_row_from_range = (
        first_data_row + len(col_a_vals) - 1 if col_a_vals else max(0, first_data_row - 1)
    )

    logger.info(
        "sheets ORDER_COUNTER order=%s first_data_row=%s column_a_rows_fetched=%s "
        "max_existing_order_number=%s last_sheet_row_with_valid_index=%s next_order_number=%s "
        "inferred_tail_row_from_fetch=%s",
        order_id,
        first_data_row,
        len(col_a_vals),
        max_existing_order,
        last_row_valid_index,
        next_order_number,
        inferred_last_sheet_row_from_range,
    )

    range_a1 = _append_range_a1(tab)
    body = {"values": [row]}

    logger.info(
        "sheets API REQUEST order=%s sheet_id=%s range=%s row=%s",
        order_id,
        sid,
        range_a1,
        json.dumps(row, ensure_ascii=False, default=str),
    )

    try:
        result = (
            service.spreadsheets()
            .values()
            .append(
                spreadsheetId=sid,
                range=range_a1,
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body=body,
            )
            .execute()
        )
    except HttpError as exc:
        logger.error(
            "[sheets] Google Sheets APPEND FAILURE (values.append) order=%s spreadsheet_id=%s tab=%s range=%s",
            order_id,
            sid,
            tab,
            range_a1,
        )
        _log_http_error(order_id=order_id, exc=exc)
        raise

    logger.info(
        "[sheets] Google Sheets APPEND SUCCESS order=%s spreadsheet_id=%s tab=%s — response details follow",
        order_id,
        sid,
        tab,
    )

    logger.info(
        "sheets API RESPONSE order=%s sheet_id=%s body=%s",
        order_id,
        sid,
        _clip_response_body(json.dumps(result, ensure_ascii=False, default=str)),
    )

    updates = result.get("updates") or {}
    updated_range = updates.get("updatedRange")
    inserted_row_index = _parse_inserted_start_row_from_updated_range(
        updated_range if isinstance(updated_range, str) else None
    )
    formatting_copied = False
    format_error: Optional[str] = None

    if inserted_row_index is None:
        logger.warning(
            "sheets FORMAT_SKIP order=%s could not parse inserted row from updatedRange=%r append=%s",
            order_id,
            updated_range,
            _clip_response_body(json.dumps(result, ensure_ascii=False, default=str)),
        )
    else:
        if inserted_row_index < first_data_row:
            logger.warning(
                "sheets FORMAT_SKIP order=%s inserted_row_index=%s < first_data_row=%s",
                order_id,
                inserted_row_index,
                first_data_row,
            )
        else:
            template_row = inserted_row_index - 1 if inserted_row_index > first_data_row else first_data_row - 1
            if template_row < 1:
                logger.warning(
                    "sheets FORMAT_SKIP order=%s invalid template_row=%s",
                    order_id,
                    template_row,
                )
            else:
                try:
                    sheet_gid = _sheet_gid_by_title(service, sid, tab)
                    _copy_row_format_above(
                        service,
                        sid,
                        sheet_gid,
                        source_row_1based=template_row,
                        dest_row_1based=inserted_row_index,
                    )
                    formatting_copied = True
                    logger.info(
                        "sheets FORMAT_COPIED order=%s inserted_row_index=%s template_row=%s sheet_gid=%s "
                        "pasteType=PASTE_FORMAT",
                        order_id,
                        inserted_row_index,
                        template_row,
                        sheet_gid,
                    )
                except HttpError as exc:
                    format_error = str(exc)
                    _log_http_error(order_id=order_id, exc=exc)
                    logger.warning(
                        "sheets FORMAT_COPY_FAILED order=%s inserted_row_index=%s template_row=%s err=%s",
                        order_id,
                        inserted_row_index,
                        template_row,
                        exc,
                    )
                except Exception as exc:
                    format_error = str(exc)
                    logger.warning(
                        "sheets FORMAT_COPY_FAILED order=%s inserted_row_index=%s template_row=%s err=%s",
                        order_id,
                        inserted_row_index,
                        template_row,
                        exc,
                        exc_info=True,
                    )

    logger.info(
        "sheets APPEND_SUMMARY order=%s last_row_valid_index=%s inferred_tail_row_from_fetch=%s "
        "next_order_number=%s inserted_row_index=%s formatting_copied=%s format_error=%s "
        "updatedRange=%r updatedRows=%s",
        order_id,
        last_row_valid_index,
        inferred_last_sheet_row_from_range,
        next_order_number,
        inserted_row_index,
        formatting_copied,
        format_error,
        updated_range,
        updates.get("updatedRows"),
    )
    return result


def append_test_row_sync() -> dict[str, Any]:
    """Used by ``GET/POST /api/test-sheets``. Returns a JSON-serializable summary."""
    date_s, time_s = _sheet_date_time_strings()
    row: list[Any] = [
        "",
        _sheet_literal_text(date_s),
        _sheet_literal_text(time_s),
        "TEST ROW",
        _sheet_str("+966500000000"),
        "Test City",
        "SA",
        "SIWAKY Test",
        1,
        99.0,
        "Pending",
        "No",
        "No",
        "No",
        4.95,
        _sheet_literal_text("127.0.0.1"),
        "Server",
        "test-sheets",
        "",
        _sheet_str("api test row"),
        _sheet_str("TEST-SHEETS-ORDER"),
    ]
    try:
        result = append_row_values_sync("TEST-SHEETS", row)
        return {
            "ok": True,
            "spreadsheet_id": _spreadsheet_id(),
            "tab": _tab_name(),
            "service_account_email": _service_account_email_for_log(load_service_account_credentials()),
            "google_append_response": result,
        }
    except Exception as exc:
        payload = sheets_exception_payload(exc)
        payload.update(
            {
                "ok": False,
                "spreadsheet_id": _spreadsheet_id() or None,
                "tab": _tab_name(),
                "service_account_email": _service_account_email_for_log(load_service_account_credentials()),
            }
        )
        logger.error("append_test_row_sync FAILED: %s", payload, exc_info=True)
        return payload


def _payload_for_log(payload: dict[str, Any]) -> dict[str, Any]:
    p = dict(payload)
    sec = p.get("secret")
    if isinstance(sec, str) and sec:
        p["secret"] = f"<redacted len={len(sec)}>"
    else:
        p["secret"] = "<empty>"
    return p


def _device_from_ua(ua: Optional[str]) -> str:
    if not ua:
        return "Unknown"
    ua_lower = ua.lower()
    if "iphone" in ua_lower or "android" in ua_lower or "mobile" in ua_lower:
        return "Mobile"
    if "ipad" in ua_lower or "tablet" in ua_lower:
        return "Tablet"
    return "Desktop"


def _build_sheet_row_and_webhook_payload(
    order: Order,
    *,
    country: Optional[str],
    webhook_secret: str,
) -> tuple[dict[str, Any], list[Any]]:
    """
    21 sheet columns (A–U), exact order:

    ``#``, Date, Time, Name, Phone, City, Country, Product, Qty, Price SAR, Status,
    Confirmed, Delivered, Returned, COD Fee, IP Address, Device, Source, Campaign,
    Notes, Order ID.

    Col ``#`` is overwritten in ``append_row_values_sync`` with the next integer from column A.
    Date/time strings use DD/MM/YYYY and HH:MM:SS (Europe/Rome). IPs use text-safe literals.
    """
    price = float(order.price_sar)
    cod_fee = round(price * 0.05, 2)
    raw_product = getattr(order, "product", None)
    product_label = (
        raw_product.strip()
        if isinstance(raw_product, str) and raw_product.strip()
        else f"SIWAKY Box x{order.quantity}"
    )
    date_s, time_s = _sheet_date_time_strings()
    source_label = _order_source_label(order)
    campaign_label = _order_campaign_label(order)
    status_label = _order_status_label(order)

    notes_s = _sheet_str(getattr(order, "notes", None))
    order_id_s = _sheet_str(order.order_id)

    payload_webhook: dict[str, Any] = {
        "date": date_s,
        "time": time_s,
        "name": order.name,
        "phone": _sheet_str(order.phone),
        "city": _sheet_str(order.city),
        "country": country or "SA",
        "product": product_label,
        "quantity": int(order.quantity),
        "price": price,
        "status": status_label,
        "confirmed": "No",
        "delivered": "No",
        "returned": "No",
        "ip_address": _sheet_str(order.ip_address),
        "device": _device_from_ua(order.user_agent),
        "source": source_label,
        "campaign": campaign_label,
        "notes": notes_s,
        "order_id": order_id_s,
        "secret": webhook_secret,
    }

    row: list[Any] = [
        "",
        _sheet_literal_text(date_s),
        _sheet_literal_text(time_s),
        _sheet_str(order.name),
        _sheet_str(order.phone),
        _sheet_str(order.city),
        _sheet_str(country or "SA"),
        product_label,
        int(order.quantity),
        price,
        status_label,
        "No",
        "No",
        "No",
        cod_fee,
        _sheet_literal_text(_sheet_str(order.ip_address)),
        _device_from_ua(order.user_agent),
        source_label,
        campaign_label,
        notes_s,
        order_id_s,
    ]
    return payload_webhook, row


def _httpx_post_google_macro_chain(
    order_id: str,
    webhook_url: str,
    *,
    raw_body: bytes,
) -> httpx.Response:
    hdrs = _webhook_headers_httpx()
    url = webhook_url.strip()
    logger.info(
        "sheets httpx order=%s hop=0 POST url=%s body_bytes=%s Origin=%s",
        order_id,
        url,
        len(raw_body),
        hdrs.get("Origin"),
    )
    resp = httpx.post(
        url,
        content=raw_body,
        headers=hdrs,
        timeout=25.0,
        follow_redirects=False,
    )
    logger.info(
        "sheets httpx order=%s hop=0 response http_status=%s final_url=%s",
        order_id,
        resp.status_code,
        str(resp.url),
    )
    hop = 0
    for _ in range(_MAX_REDIRECT_HOPS):
        if resp.status_code in {301, 302, 303, 307, 308} and resp.headers.get("location"):
            hop += 1
            nxt = resp.headers["location"].strip()
            next_url = (
                urljoin(str(resp.url), nxt)
                if not nxt.lower().startswith(("http://", "https://"))
                else nxt
            )
            logger.info(
                "sheets httpx order=%s redirect hop=%s -> POST %s (from HTTP %s)",
                order_id,
                hop,
                next_url,
                resp.status_code,
            )
            url = next_url
            resp = httpx.post(url, content=raw_body, headers=hdrs, timeout=25.0, follow_redirects=False)
            logger.info(
                "sheets httpx order=%s hop=%s response http_status=%s final_url=%s",
                order_id,
                hop,
                resp.status_code,
                str(resp.url),
            )
            continue
        break

    snippet = resp.text.strip()
    logger.info(
        "sheets httpx order=%s chain done http_status=%s response_body=%s",
        order_id,
        resp.status_code,
        _clip_response_body(snippet),
    )
    return resp


def _post_sheet_via_curl_cffi(order_id: str, webhook_url: str, *, raw_body: bytes) -> tuple[int, str]:
    from curl_cffi import requests as crequests

    url = webhook_url.strip()
    hdrs = _webhook_headers_curl(len(raw_body))
    logger.info(
        "sheets curl-cffi order=%s POST url=%s body_bytes=%s Origin=%s",
        order_id,
        url,
        len(raw_body),
        hdrs.get("Origin"),
    )
    resp = crequests.post(
        url,
        data=raw_body,
        headers=hdrs,
        impersonate="chrome",
        timeout=28,
        allow_redirects=True,
    )
    body = resp.text
    logger.info(
        "sheets curl-cffi order=%s response http_status=%s response_body=%s",
        order_id,
        resp.status_code,
        _clip_response_body(body),
    )
    return resp.status_code, body


def _post_sheet_sync(order_id: str, webhook_url: str, raw_body: bytes) -> tuple[int, str]:
    try:
        return _post_sheet_via_curl_cffi(order_id, webhook_url, raw_body=raw_body)
    except ImportError:
        logger.warning(
            "sheets order=%s curl-cffi not installed; falling back to httpx chained POST",
            order_id,
        )
    except Exception as exc:
        logger.warning(
            "sheets order=%s curl-cffi failed (%s); falling back to httpx chain",
            order_id,
            exc,
            exc_info=True,
        )

    r = _httpx_post_google_macro_chain(order_id, webhook_url, raw_body=raw_body)
    return r.status_code, r.text


def _analyze_apps_reply(order_id: str, *, status_code: int, body: str) -> None:
    snippet = body.strip()
    if not snippet:
        logger.warning("sheets webhook empty body for order %s (HTTP %s)", order_id, status_code)
        return

    if snippet.startswith("<"):
        logger.error(
            "sheets webhook returned HTML for order %s (HTTP %s): %s",
            order_id,
            status_code,
            _clip_response_body(snippet),
        )
        return

    try:
        data = json.loads(snippet)
    except json.JSONDecodeError:
        logger.warning(
            "sheets webhook non-JSON for order %s (HTTP %s): %s",
            order_id,
            status_code,
            _clip_response_body(snippet),
        )
        return

    if isinstance(data, dict) and data.get("ok") is False:
        logger.error(
            "Apps Script ok=false order=%s error=%s response=%s",
            order_id,
            data.get("error"),
            _clip_response_body(snippet),
        )
    else:
        logger.info("Apps Script OK order=%s: %s", order_id, _clip_response_body(snippet))


async def send_order(order: Order, *, country: Optional[str] = None) -> None:
    webhook_secret = _sheets_secret()
    if not webhook_secret:
        logger.warning(
            "SHEETS_WEBHOOK_SECRET empty — Apps Script fallback may fail for %s if script checks secret",
            order.order_id,
        )

    payload_webhook, row_values = _build_sheet_row_and_webhook_payload(
        order,
        country=country,
        webhook_secret=webhook_secret,
    )

    logger.info(
        "sheets ORDER DATA received order_id=%s name=%s phone=%s city=%s country=%s qty=%s price_sar=%s "
        "product=%s status_db=%s ip=%s ua_device=%s source=%s campaign=%s event_id=%s",
        order.order_id,
        order.name,
        order.phone,
        order.city or "",
        country or "SA",
        order.quantity,
        order.price_sar,
        getattr(order, "product", None) or "SIWAKY Box",
        order.status,
        order.ip_address or "",
        _device_from_ua(order.user_agent),
        _order_source_label(order),
        _order_campaign_label(order),
        order.event_id or "",
    )
    logger.info(
        "sheets ROW preview (21 cols A–U) order=%s row=%s",
        order.order_id,
        json.dumps(row_values, ensure_ascii=False, default=str),
    )

    if sheets_api_configured():
        try:
            await asyncio.to_thread(append_row_values_sync, order.order_id, row_values)
            logger.info(
                "sheets STORED via API order=%s sheet_id=%s email=%s",
                order.order_id,
                _spreadsheet_id(),
                _service_account_email_for_log(load_service_account_credentials()),
            )
            return
        except Exception as exc:
            logger.error(
                "sheets API failed order=%s — falling back to webhook if set. Error=%s",
                order.order_id,
                str(exc),
                exc_info=True,
            )
            logger.error(
                "sheets FULL ERROR DETAIL order=%s payload=%s",
                order.order_id,
                sheets_exception_payload(exc),
            )

    webhook_url = _sheets_webhook_url()
    if not webhook_url:
        if not sheets_api_configured():
            logger.warning(
                "sheets SKIPPED order=%s: configure SIWAKY_SPREADSHEET_ID + SIWAKY_SHEET_TAB + "
                "GOOGLE_SERVICE_ACCOUNT_JSON or SIWAKY_GOOGLE_CREDENTIALS_PATH (or legacy EMAIL+KEY); "
                "or set SHEETS_WEBHOOK_URL.",
                order.order_id,
            )
        return

    raw_body = json.dumps(payload_webhook, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    o, r = _site_origin_referer()
    logger.info(
        "sheets webhook BEGIN order=%s url=%s payload=%s bytes=%s Origin=%s Referer=%s",
        order.order_id,
        webhook_url,
        json.dumps(_payload_for_log(payload_webhook), ensure_ascii=False),
        len(raw_body),
        o,
        r,
    )

    try:
        status_code, body = await asyncio.to_thread(_post_sheet_sync, order.order_id, webhook_url, raw_body)

        logger.info(
            "sheets webhook RESPONSE order=%s http_status=%s body=%s",
            order.order_id,
            status_code,
            _clip_response_body(body),
        )

        _analyze_apps_reply(order.order_id, status_code=status_code, body=body)

        if status_code >= 400:
            logger.warning("sheets webhook HTTP failure order=%s status=%s", order.order_id, status_code)
        elif status_code >= 200:
            logger.info("sheets webhook DONE order=%s http_status=%s", order.order_id, status_code)

    except Exception as exc:
        logger.error("sheets webhook EXCEPTION order=%s — %s", order.order_id, exc, exc_info=True)
