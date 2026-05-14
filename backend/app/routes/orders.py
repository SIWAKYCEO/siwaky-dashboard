from __future__ import annotations

import asyncio
import logging
import traceback
from datetime import date, datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.constants.offers import resolve_offer
from app.database import get_db
from app.models.order import Order
from app.schemas.order import OrderCreate, OrderResponse
from app.services import geo_check, pixels_capi, sheets_webhook
from app.services.geo_check import GeoResult
from app.services.phone import normalize_phone

logger = logging.getLogger("siwaky.orders")
router = APIRouter()

WHITELIST_PHONE = "+966550000000"


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> OrderResponse:
    try:
        logger.info(
            "create_order — dati ricevuti (raw): name=%s phone=%s city=%s offer=%s qty=%s price_sar=%s "
            "source=%s campaign=%s event_id=%s",
            payload.name,
            payload.phone,
            payload.city,
            payload.offer,
            payload.quantity,
            payload.price_sar,
            payload.source,
            payload.campaign,
            payload.event_id,
        )

        # ── 1) Name validation ──────────────────────────────────────────
        name = payload.name.strip()
        if len(name) < 3:
            raise HTTPException(status_code=400, detail={"error": "invalid_name"})

        # ── 2) Phone normalisation ──────────────────────────────────────
        try:
            phone = normalize_phone(payload.phone)
        except Exception as exc:
            logger.error("normalize_phone failed: %s", exc)
            raise HTTPException(status_code=400, detail={"error": "invalid_phone"})

        if not phone:
            logger.warning("phone normalised to empty: raw=%s", payload.phone)
            raise HTTPException(status_code=400, detail={"error": "invalid_phone"})

        logger.info("phone normalised: %s → %s", payload.phone, phone)

        # ── 3) DB connectivity check ────────────────────────────────────
        try:
            db.execute(text("SELECT 1"))
            logger.info("DB connectivity OK")
        except Exception as exc:
            logger.error("DB connectivity check failed: %s\n%s", exc, traceback.format_exc())
            raise HTTPException(status_code=503, detail={"error": "db_unavailable"})

        # ── 4) Geo / fraud check ────────────────────────────────────────
        ip = _client_ip(request)
        ua = request.headers.get("user-agent", "")
        logger.info("client ip=%s", ip)

        try:
            geo: GeoResult = await geo_check.check_ip(ip, phone=phone)
        except Exception as exc:
            logger.error("geo_check raised: %s\n%s", exc, traceback.format_exc())
            # fail open — allow the order
            geo = GeoResult(allowed=True, reason="error")

        if not geo.allowed and phone != WHITELIST_PHONE:
            logger.info("order rejected: geo=%s ip=%s phone=%s", geo.reason, ip, phone)
            raise HTTPException(status_code=403, detail={"error": "geo_blocked", "reason": geo.reason})

        # ── 5) Insert order ─────────────────────────────────────────────
        try:
            bundle_qty, bundle_price, product_label = resolve_offer(payload.offer)
            if int(payload.quantity) != bundle_qty:
                logger.warning(
                    "offer/qty mismatch: offer=%s payload_qty=%s expected=%s",
                    payload.offer,
                    payload.quantity,
                    bundle_qty,
                )
                raise HTTPException(
                    status_code=400,
                    detail={"error": "invalid_offer_quantity", "expected": bundle_qty},
                )
            if payload.price_sar != bundle_price:
                logger.warning(
                    "offer/price mismatch: offer=%s payload_price=%s expected=%s",
                    payload.offer,
                    payload.price_sar,
                    bundle_price,
                )
                raise HTTPException(
                    status_code=400,
                    detail={"error": "invalid_offer_price", "expected": str(bundle_price)},
                )

            today = date.today()
            order_id = _next_order_id(db, today)
            logger.info("generated order_id=%s", order_id)

            order = Order(
                order_id=order_id,
                name=name,
                phone=phone,
                city=payload.city,
                product=product_label,
                offer=payload.offer,
                quantity=bundle_qty,
                price_sar=bundle_price,
                status="pending",
                source=payload.source,
                campaign=payload.campaign,
                event_id=payload.event_id,
                ip_address=ip,
                user_agent=ua,
            )
            db.add(order)
            db.commit()
            db.refresh(order)
            logger.info("order inserted: %s", order.order_id)

        except Exception as exc:
            db.rollback()
            logger.error("DB insert failed: %s\n%s", exc, traceback.format_exc())
            raise HTTPException(status_code=500, detail={"error": "db_insert_failed", "detail": str(exc)})

        # ── 6) Best-effort fan-out ──────────────────────────────────────
        try:
            asyncio.create_task(
                _fanout(order, ip=ip, ua=ua,
                        country=geo.country,
                        event_source_url=str(request.base_url) + "thank-you"),
            )
        except Exception as exc:
            logger.warning("create_task for fan-out failed (non-fatal): %s", exc)

        return OrderResponse(
            order_id=order.order_id,
            status=order.status,
            price_sar=order.price_sar,
            event_id=order.event_id,
            created_at=order.created_at,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("unhandled exception in create_order: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": "server_error", "detail": str(exc)})


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Annotated[Session, Depends(get_db)]) -> OrderResponse:
    try:
        order = db.execute(select(Order).where(Order.order_id == order_id)).scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail={"error": "not_found"})
        return OrderResponse(
            order_id=order.order_id,
            status=order.status,
            price_sar=order.price_sar,
            event_id=order.event_id,
            created_at=order.created_at,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_order failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": "server_error", "detail": str(exc)})


# ── Helpers ──────────────────────────────────────────────────────────────────

def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    return request.client.host if request.client else "0.0.0.0"


def _next_order_id(db: Session, today: date) -> str:
    count = db.execute(
        select(func.count(Order.id)).where(func.date(Order.created_at) == today)
    ).scalar_one() or 0
    return f"ORD-{today.strftime('%Y%m%d')}-{count + 1:03d}"


async def _fanout(order: Order, *, ip: str, ua: str, country: Optional[str] = None, event_source_url: str) -> None:
    try:
        await asyncio.gather(
            sheets_webhook.send_order(order, country=country),
            pixels_capi.meta_purchase(order, ip=ip, ua=ua, source_url=event_source_url),
            pixels_capi.tiktok_purchase(order, ip=ip, ua=ua, source_url=event_source_url),
            pixels_capi.snap_purchase(order, ip=ip, ua=ua, source_url=event_source_url),
            return_exceptions=True,
        )
    except Exception:
        logger.exception("fan-out failed for order %s", order.order_id)
