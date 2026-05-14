from __future__ import annotations

import logging

from fastapi import APIRouter
from sqlalchemy import text

from app import __version__
from app.database import engine

logger = logging.getLogger("siwaky.health")
router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    result: dict = {"status": "ok", "version": __version__, "db": "unknown", "orders_table": "unknown"}

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            result["db"] = "ok"
    except Exception as exc:
        logger.error("Health DB check failed: %s", exc)
        result["status"] = "degraded"
        result["db"] = f"error: {exc}"
        return result

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1 FROM orders LIMIT 1"))
            result["orders_table"] = "ok"
    except Exception as exc:
        logger.error("orders table missing or broken: %s", exc)
        result["status"] = "degraded"
        result["orders_table"] = f"missing: {exc}"

    return result
