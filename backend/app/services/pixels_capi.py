"""Server-side CAPI for Meta, TikTok and Snapchat.

Every event re-uses the ``event_id`` stored on the order so the ad networks
de-dup against the web pixel call that fired client-side on ``/thank-you``.
"""

from __future__ import annotations

import hashlib
import logging
import time
import uuid
from typing import Any, Optional

import httpx

from app.config import settings
from app.models.order import Order

logger = logging.getLogger("siwaky.capi")


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _sha256_lower(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()


def _split_name(full: str) -> tuple[str, str]:
    parts = full.strip().split(" ", 1)
    return (parts[0], parts[1] if len(parts) > 1 else "")


def _event_id(order: Order) -> str:
    return order.event_id or str(uuid.uuid4())


def _event_time(order: Order) -> int:
    return int((order.created_at.timestamp() if order.created_at else time.time()))


# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------

async def meta_purchase(order: Order, *, ip: str, ua: str, source_url: str) -> None:
    if not settings.meta_pixel_id or not settings.meta_access_token:
        return
    first, last = _split_name(order.name)
    digits = order.phone.lstrip("+")  # Meta wants digits only with country code
    payload: dict[str, Any] = {
        "data": [
            {
                "event_name": "Purchase",
                "event_time": _event_time(order),
                "event_id": _event_id(order),
                "action_source": "website",
                "event_source_url": source_url,
                "user_data": {
                    "ph": [_sha256_lower(digits)],
                    "fn": [_sha256_lower(first)] if first else [],
                    "ln": [_sha256_lower(last)] if last else [],
                    "client_ip_address": ip,
                    "client_user_agent": ua,
                },
                "custom_data": {
                    "value": float(order.price_sar),
                    "currency": "SAR",
                    "content_ids": [order.offer or "siwaky-box"],
                    "content_type": "product",
                    "num_items": int(order.quantity),
                },
            }
        ]
    }
    url = f"https://graph.facebook.com/v18.0/{settings.meta_pixel_id}/events"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                url,
                params={"access_token": settings.meta_access_token},
                json=payload,
            )
            if r.status_code >= 400:
                logger.warning("meta CAPI %s: %s", r.status_code, r.text[:300])
    except Exception as exc:  # noqa: BLE001
        logger.warning("meta CAPI failed: %s", exc)


# ---------------------------------------------------------------------------
# TikTok
# ---------------------------------------------------------------------------

async def tiktok_purchase(order: Order, *, ip: str, ua: str, source_url: str) -> None:
    if not settings.tiktok_pixel_id or not settings.tiktok_access_token:
        return
    # TikTok wants phone prefixed with `+` (E.164) before hashing
    phone_e164 = order.phone if order.phone.startswith("+") else f"+{order.phone}"
    payload: dict[str, Any] = {
        "event_source": "web",
        "event_source_id": settings.tiktok_pixel_id,
        "data": [
            {
                "event": "PlaceAnOrder",
                "event_time": _event_time(order),
                "event_id": _event_id(order),
                "user": {
                    "phone": _sha256_lower(phone_e164),
                    "ip": ip,
                    "user_agent": ua,
                },
                "properties": {
                    "currency": "SAR",
                    "value": float(order.price_sar),
                    "contents": [
                        {
                            "content_id": order.offer or "siwaky-box",
                            "content_type": "product",
                            "quantity": int(order.quantity),
                        }
                    ],
                },
                "page": {"url": source_url},
            }
        ],
    }
    url = "https://business-api.tiktok.com/open_api/v1.3/event/track/"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                url,
                headers={"Access-Token": settings.tiktok_access_token},
                json=payload,
            )
            if r.status_code >= 400:
                logger.warning("tiktok CAPI %s: %s", r.status_code, r.text[:300])
    except Exception as exc:  # noqa: BLE001
        logger.warning("tiktok CAPI failed: %s", exc)


# ---------------------------------------------------------------------------
# Snapchat
# ---------------------------------------------------------------------------

async def snap_purchase(order: Order, *, ip: str, ua: str, source_url: str) -> None:
    if not settings.snap_pixel_id or not settings.snap_access_token:
        return
    digits = order.phone.lstrip("+")
    payload: dict[str, Any] = {
        "pixel_id": settings.snap_pixel_id,
        "event_type": "PURCHASE",
        "event_conversion_type": "WEB",
        "timestamp": _event_time(order) * 1000,
        "client_dedup_id": _event_id(order),
        "hashed_phone_number": _sha256_lower(digits),
        "user_agent": ua,
        "client_ip_address": ip,
        "price": float(order.price_sar),
        "currency": "SAR",
        "item_ids": [order.offer or "siwaky-box"],
        "number_items": int(order.quantity),
        "page_url": source_url,
    }
    url = "https://tr.snapchat.com/v2/conversion"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                url,
                headers={"Authorization": f"Bearer {settings.snap_access_token}"},
                json=payload,
            )
            if r.status_code >= 400:
                logger.warning("snap CAPI %s: %s", r.status_code, r.text[:300])
    except Exception as exc:  # noqa: BLE001
        logger.warning("snap CAPI failed: %s", exc)
