"""Web Push: subscribe + VAPID public key."""

from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import APIRouter, HTTPException
from pywebpush import WebPushException

from app.services import push_store
from app.services.push_notify import send_test_push_to_subscription, vapid_public_key_b64url

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/push", tags=["push"])


@router.get("/vapid-public")
def vapid_public():
    if not os.getenv("VAPID_PRIVATE_KEY", "").strip() and not os.getenv("VAPID_PUBLIC_KEY", "").strip():
        raise HTTPException(status_code=503, detail="VAPID keys not configured")
    try:
        return {"publicKey": vapid_public_key_b64url()}
    except Exception as e:
        logger.exception("[push] vapid-public failed")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/subscribe")
async def subscribe(body: dict[str, Any]):
    if not os.getenv("VAPID_PRIVATE_KEY", "").strip():
        raise HTTPException(status_code=503, detail="VAPID_PRIVATE_KEY not configured")

    endpoint = body.get("endpoint")
    if not isinstance(endpoint, str) or len(endpoint) < 12:
        raise HTTPException(status_code=422, detail="Missing or invalid subscription endpoint")

    keys = body.get("keys")
    if not isinstance(keys, dict):
        keys = {}
    keys_out: dict[str, str] = {}
    for k, v in keys.items():
        if isinstance(k, str) and isinstance(v, str):
            keys_out[k] = v

    exp = body.get("expirationTime")
    sub: dict[str, Any] = {"endpoint": endpoint, "keys": keys_out}
    if exp is not None and isinstance(exp, (int, float)):
        sub["expirationTime"] = int(exp)

    push_store.upsert_subscription(sub)
    logger.info("[push] subscription saved endpoint=%s", endpoint[:72])
    return {"ok": True, "subscribers": len(push_store.load_subscriptions())}


@router.post("/test")
def push_test(body: dict[str, Any]):
    """Send one test notification to the subscription JSON in the body (same shape as subscribe)."""
    if not os.getenv("VAPID_PRIVATE_KEY", "").strip():
        raise HTTPException(status_code=503, detail="VAPID_PRIVATE_KEY not configured")

    endpoint = body.get("endpoint")
    if not isinstance(endpoint, str) or len(endpoint) < 12:
        raise HTTPException(status_code=422, detail="Missing or invalid subscription endpoint")

    keys = body.get("keys")
    if not isinstance(keys, dict):
        keys = {}
    keys_out: dict[str, str] = {}
    for k, v in keys.items():
        if isinstance(k, str) and isinstance(v, str):
            keys_out[k] = v

    exp = body.get("expirationTime")
    sub: dict[str, Any] = {"endpoint": endpoint, "keys": keys_out}
    if exp is not None and isinstance(exp, (int, float)):
        sub["expirationTime"] = int(exp)

    try:
        send_test_push_to_subscription(sub)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except WebPushException as exc:
        status = getattr(getattr(exc, "response", None), "status_code", None)
        logger.warning("[push] test WebPushException status=%s", status)
        raise HTTPException(status_code=502, detail=f"WebPush failed: {exc}") from exc
    except Exception as e:
        logger.exception("[push] test failed")
        raise HTTPException(status_code=500, detail=str(e)) from e

    return {"ok": True}
