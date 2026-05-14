from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ("https://www.googleapis.com/auth/spreadsheets.readonly",)

# Contiguous header cells that identify the real table header row (emoji labels).
HEADER_SIGNATURE: tuple[str, ...] = (
    "👤 Name",
    "📱 Phone",
    "🏙️ City",
    "🌍 Country",
    "📦 Product",
    "🔢 Qty",
    "💰 Price SAR",
    "🚚 Status",
    "✅ Confirmed",
    "📬 Delivered",
    "↩️ Returned",
    "💵 COD Fee",
    "🌐 IP Address",
    "📱 Device",
)

# Output dict keys aligned with HEADER_SIGNATURE positions.
ORDER_OUTPUT_KEYS: tuple[str, ...] = (
    "name",
    "phone",
    "city",
    "country",
    "product",
    "qty",
    "price_sar",
    "status",
    "confirmed",
    "delivered",
    "returned",
    "cod_fee",
    "ip_address",
    "devic",
)


def _build_sheets_resource(credentials_path: Path):
    creds = service_account.Credentials.from_service_account_file(
        str(credentials_path),
        scopes=SCOPES,
    )
    return build("sheets", "v4", credentials=creds, cache_discovery=False)


def fetch_orders_as_rows(
    credentials_path: Path,
    spreadsheet_id: str,
    sheet_tab: str,
) -> list[list[str]]:
    """Reads a wide slice (A–Z) so preamble columns plus emoji headers and data cells are included."""
    service = _build_sheets_resource(credentials_path)
    range_name = f"{sheet_tab}!A:Z"

    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range=range_name)
        .execute()
    )
    rows = result.get("values") or []
    return rows


def list_sheet_titles(credentials_path: Path, spreadsheet_id: str) -> list[str]:
    service = _build_sheets_resource(credentials_path)
    meta = (
        service.spreadsheets()
        .get(spreadsheetId=spreadsheet_id, fields="sheets.properties.title")
        .execute()
    )
    out: list[str] = []
    for sheet in meta.get("sheets") or []:
        title = sheet.get("properties", {}).get("title")
        if title is not None:
            out.append(title)
    return out


def _cell_str(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _signature_start_column(row: list[str]) -> int | None:
    """First column index where HEADER_SIGNATURE matches consecutive cells (stripped)."""
    sig = HEADER_SIGNATURE
    n = len(sig)
    cells = [_cell_str(c) for c in row]
    last_start = len(cells) - n
    if last_start < 0:
        return None
    for start in range(last_start + 1):
        if all(cells[start + i] == sig[i] for i in range(n)):
            return start
    return None


def _find_header_row_and_signature_start(rows: list[list[str]]) -> tuple[int, int]:
    for ri, row in enumerate(rows):
        start = _signature_start_column(row)
        if start is not None:
            return ri, start
    raise ValueError("Expected orders header row was not found in the sheet.")


def extract_orders_from_sheet_rows(rows: list[list[str]]) -> list[dict[str, str]]:
    """
    Locate the row whose cells include the emoji header signature, then return one dict per
    subsequent non-empty data row with normalized English keys.
    """
    if not rows:
        return []

    header_idx, start_col = _find_header_row_and_signature_start(rows)
    n = len(HEADER_SIGNATURE)
    keys = ORDER_OUTPUT_KEYS

    out: list[dict[str, str]] = []
    for raw in rows[header_idx + 1 :]:
        values = [
            _cell_str(raw[start_col + j]) if start_col + j < len(raw) else ""
            for j in range(n)
        ]
        if all(v == "" for v in values):
            continue
        out.append({keys[j]: values[j] for j in range(n)})

    return out
