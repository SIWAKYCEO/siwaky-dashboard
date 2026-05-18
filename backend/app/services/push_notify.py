"""Send Web Push notifications when new orders appear (GET /orders diff)."""

from __future__ import annotations

import base64
import json
import logging
import os
from typing import Any

from pywebpush import WebPushException, webpush

from app.services import push_store

logger = logging.getLogger(__name__)


def _mailto_claim() -> str:
    email = os.getenv("VAPID_EMAIL", "").strip() or "siwaky.assistance@gmail.com"
    return f"mailto:{email}"


def _private_pem() -> str:
    raw = os.getenv("VAPID_PRIVATE_KEY", "").strip()
    if not raw:
        raise ValueError("VAPID_PRIVATE_KEY is not set")
    return raw.replace("\\n", "\n")


def vapid_public_key_b64url() -> str:
    """Public key for PushManager.subscribe (base64url, no padding), same as `web-push generate-vapid-keys`."""
    explicit = os.getenv("VAPID_PUBLIC_KEY", "").strip()
    if explicit:
        return explicit

    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.serialization import load_pem_private_key

    pem = _private_pem()
    key = load_pem_private_key(pem.encode("utf-8"), password=None, backend=default_backend())
    pub = key.public_key()
    raw = pub.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    )
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _drop_subscription(endpoint: str) -> None:
    subs = push_store.load_subscriptions()
    next_subs = [s for s in subs if s.get("endpoint") != endpoint]
    if len(next_subs) != len(subs):
        push_store.save_subscriptions(next_subs)
        logger.info("[push] removed dead subscription endpoint=%s", endpoint[:48])


def send_test_push_to_subscription(sub: dict[str, Any]) -> None:
    """
    Send one server-side Web Push to a single subscription (device verification after subscribe).
    """
    if not os.getenv("VAPID_PRIVATE_KEY", "").strip():
        raise ValueError("VAPID_PRIVATE_KEY is not set")

    payload = {
        "title": "🌿 SIWAKY",
        "body": "Prova server — se la vedi, la push dal backend funziona.",
        "icon": "/icons/icon-192x192.png",
        "url": "/dashboard",
        "tag": "siwaky-push-test",
    }
    pem = _private_pem()
    claims = {"sub": _mailto_claim()}
    data = json.dumps(payload, ensure_ascii=False)
    webpush(
        subscription_info=sub,
        data=data,
        vapid_private_key=pem,
        vapid_claims=claims,
        ttl=3600,
    )


def send_order_push_to_all(order: dict[str, str]) -> None:
    if not os.getenv("VAPID_PRIVATE_KEY", "").strip():
        logger.debug("[push] skip: VAPID_PRIVATE_KEY unset")
        return

    name = (order.get("name") or "").strip() or "عميل"
    product = (order.get("product") or "").strip() or "منتج"
    price = (order.get("price_sar") or "").strip()
    body = f"{name} · {product}"
    if price:
        body = f"{body} · {price} ر.س"

    payload = {
        "title": "🌿 طلب جديد — سواكي",
        "body": body,
        "icon": "/icons/icon-192x192.png",
        "url": "/dashboard",
        "tag": f"order-{order.get('order_id', '')}"[:128],
        "order_id": order.get("order_id", ""),
    }

    pem = _private_pem()
    claims = {"sub": _mailto_claim()}
    data = json.dumps(payload, ensure_ascii=False)
    subs = push_store.load_subscriptions()
    if not subs:
        return

    for sub in subs:
        endpoint = str(sub.get("endpoint", ""))
        try:
            webpush(
                subscription_info=sub,
                data=data,
                vapid_private_key=pem,
                vapid_claims=claims,
                ttl=86400,
            )
        except WebPushException as exc:
            status = getattr(exc, "response", None)
            code = getattr(status, "status_code", None) if status is not None else None
            logger.warning("[push] WebPushException status=%s endpoint=%s", code, endpoint[:64])
            if code in (404, 410):
                _drop_subscription(endpoint)
        except Exception:
            logger.exception("[push] unexpected error endpoint=%s", endpoint[:64])


def process_orders_for_push(orders: list[dict[str, str]]) -> None:
    """
    After a successful sheet read: notify only for order_ids not seen before.
    First successful non-empty snapshot bootstraps `seen` without notifications.
    """
    if not os.getenv("VAPID_PRIVATE_KEY", "").strip():
        return

    if not orders:
        return

    state = push_store.load_seen_state()
    seen: set[str] = set(state.get("seen", []))
    bootstrapped = bool(state.get("bootstrapped"))

    current_ids: list[str] = []
    for o in orders:
        oid = (o.get("order_id") or "").strip()
        if oid:
            current_ids.append(oid)
    current_set = set(current_ids)

    if not bootstrapped:
        push_store.save_seen_state(bootstrapped=True, seen=current_set)
        logger.info("[push] bootstrap seen=%s orders (no notifications)", len(current_set))
        return

    # Sheet order is newest-first; notify in arrival order (oldest new first feels wrong for "new row" —
    # we notify newest-first to match the live feed emphasis.)
    new_orders: list[dict[str, str]] = []
    for o in orders:
        oid = (o.get("order_id") or "").strip()
        if oid and oid not in seen:
            new_orders.append(o)

    if not new_orders:
        return

    for o in new_orders:
        send_order_push_to_all(o)

    for o in new_orders:
        oid = (o.get("order_id") or "").strip()
        if oid:
            seen.add(oid)
    push_store.save_seen_state(bootstrapped=True, seen=seen)
