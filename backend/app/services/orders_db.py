"""Load dashboard orders from the siwaky PostgreSQL `orders` table."""

from __future__ import annotations

import datetime
import decimal
from typing import Any

import psycopg
from psycopg.rows import dict_row

# Schema matches `app.models.order.Order` (siwaky store API).
_ORDERS_SQL = """
SELECT
  id,
  order_id,
  created_at,
  name,
  phone,
  city,
  product,
  offer,
  quantity,
  price_sar,
  status,
  source,
  campaign,
  ip_address,
  user_agent,
  notes,
  event_id
FROM orders
ORDER BY created_at DESC NULLS LAST
LIMIT 10000
"""


def _cell(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, decimal.Decimal):
        return str(v)
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.isoformat()
    return str(v).strip()


def _split_date_time(created_at: Any) -> tuple[str, str]:
    if created_at is None:
        return "", ""
    if isinstance(created_at, datetime.datetime):
        return created_at.strftime("%Y-%m-%d"), created_at.strftime("%H:%M:%S")
    if isinstance(created_at, datetime.date):
        return created_at.isoformat(), ""
    s = _cell(created_at)
    if "T" in s:
        d, t = s.split("T", 1)
        return d, t.replace("Z", "")[:8] if len(t) >= 8 else t
    if " " in s:
        parts = s.split()
        return parts[0], parts[1][:8] if len(parts) > 1 else ""
    return s, ""


def _notes_from_row(row: dict[str, Any]) -> str:
    n = _cell(row.get("notes"))
    if n:
        return n
    return _cell(row.get("offer"))


def fetch_orders_array(*, database_url: str) -> list[dict[str, str]]:
    """Returns a list of order dicts for `GET /orders` (JSON array)."""
    if not database_url:
        raise ValueError("DATABASE_URL is empty")

    out: list[dict[str, str]] = []
    with psycopg.connect(database_url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(_ORDERS_SQL)
            for row in cur:
                date_s, time_s = _split_date_time(row.get("created_at"))
                qty = row.get("quantity")
                qty_s = _cell(qty) if qty is not None else ""
                ev = _cell(row.get("event_id"))
                notes_val = _notes_from_row(row)
                if ev and notes_val:
                    notes_val = f"{notes_val} · event:{ev}"
                elif ev:
                    notes_val = f"event:{ev}"
                out.append(
                    {
                        "order_id": _cell(row.get("order_id")),
                        "date": date_s,
                        "time": time_s,
                        "name": _cell(row.get("name")),
                        "phone": _cell(row.get("phone")),
                        "city": _cell(row.get("city")),
                        "country": "",
                        "product": _cell(row.get("product")),
                        "quantity": qty_s,
                        "price_sar": _cell(row.get("price_sar")),
                        "status": _cell(row.get("status")),
                        "confirmed": "",
                        "delivered": "",
                        "returned": "",
                        "cod_fee": "",
                        "ip_address": _cell(row.get("ip_address")),
                        "device": _cell(row.get("user_agent")),
                        "source": _cell(row.get("source")),
                        "campaign": _cell(row.get("campaign")),
                        "notes": notes_val,
                    }
                )
    return out


def ping_database(database_url: str) -> tuple[bool, str | None]:
    """Returns (ok, error_message)."""
    if not database_url.strip():
        return False, "no_database_url"
    try:
        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return True, None
    except Exception as e:
        return False, str(e)
