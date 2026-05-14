"""Storefront checkout: insert rows into PostgreSQL `orders` (same DB as dashboard GET /orders)."""

from __future__ import annotations

import logging
import traceback
from decimal import Decimal
from fastapi import APIRouter, HTTPException, Request, status

from app.config import last_database_resolution_error, resolved_database_url
from app.constants.offers import resolve_offer
from app.schemas.order import OrderCreate, OrderResponse
from app.services.orders_db import insert_store_order
from app.services.phone import normalize_phone

logger = logging.getLogger("siwaky.store_orders")

router = APIRouter(prefix="/api/orders", tags=["store"])


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    return request.client.host if request.client else "0.0.0.0"


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_store_order(payload: OrderCreate, request: Request) -> OrderResponse:
    """Insert a new pending order — no geo / fan-out (dashboard reads raw rows)."""
    url = resolved_database_url()
    if not url:
        logger.error(
            "create_store_order refused: database URL unresolved — %s",
            last_database_resolution_error(),
        )
        raise HTTPException(
            status_code=503,
            detail={"error": "db_unavailable", "detail": last_database_resolution_error() or ""},
        )

    name = payload.name.strip()
    if len(name) < 3:
        raise HTTPException(status_code=400, detail={"error": "invalid_name"})

    phone = normalize_phone(payload.phone)
    if not phone:
        logger.warning("create_store_order invalid phone raw=%s", payload.phone)
        raise HTTPException(status_code=400, detail={"error": "invalid_phone"})

    try:
        bundle_qty, bundle_price, product_label = resolve_offer(payload.offer)
    except Exception as exc:  # noqa: BLE001
        logger.exception("resolve_offer failed: %s", exc)
        raise HTTPException(status_code=400, detail={"error": "invalid_offer"}) from exc

    if int(payload.quantity) != bundle_qty:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_offer_quantity", "expected": bundle_qty},
        )
    if payload.price_sar != bundle_price:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_offer_price", "expected": str(bundle_price)},
        )

    ip = _client_ip(request)
    ua = request.headers.get("user-agent") or ""

    try:
        order_id, created_at = insert_store_order(
            database_url=url,
            name=name,
            phone=phone,
            city=payload.city,
            product=product_label,
            offer=payload.offer,
            quantity=bundle_qty,
            price_sar=Decimal(str(bundle_price)),
            status="pending",
            source=payload.source,
            campaign=payload.campaign,
            ip_address=ip,
            user_agent=ua,
            event_id=payload.event_id,
            notes=payload.notes,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("insert_store_order failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={"error": "db_insert_failed", "detail": str(exc)},
        ) from exc

    return OrderResponse(
        order_id=order_id,
        status="pending",
        price_sar=Decimal(str(bundle_price)),
        event_id=payload.event_id,
        created_at=created_at,
    )
