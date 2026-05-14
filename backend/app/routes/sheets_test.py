"""Diagnostic endpoint: append a test row to Google Sheets."""

from __future__ import annotations

import asyncio
import logging
import os

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from app.services import sheets_webhook

logger = logging.getLogger("siwaky.sheets_test")

router = APIRouter()


def _verify_test_token(request: Request) -> None:
    expected = (os.environ.get("SHEETS_TEST_TOKEN") or "").strip()
    if not expected:
        return
    got = (request.headers.get("X-Sheets-Test-Token") or "").strip()
    if got != expected:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing X-Sheets-Test-Token (set SHEETS_TEST_TOKEN in Easypanel).",
        )


@router.get("/test-sheets", tags=["sheets"])
@router.post("/test-sheets", tags=["sheets"])
async def api_test_sheets(request: Request) -> JSONResponse:
    """
    Appends one fixed test row via the same Google Sheets API path as real orders.
    On failure, the response body and Easypanel logs contain the full Google error.
    Optional: set ``SHEETS_TEST_TOKEN`` and send header ``X-Sheets-Test-Token: <same>`` to protect this route.
    """
    _verify_test_token(request)
    try:
        result = await asyncio.to_thread(sheets_webhook.append_test_row_sync)
        return JSONResponse(content=result, status_code=200 if result.get("ok") else 502)
    except Exception as exc:
        payload = sheets_webhook.sheets_exception_payload(exc)
        logger.error("api_test_sheets failed: %s", payload, exc_info=True)
        return JSONResponse(
            content={"ok": False, **payload},
            status_code=502,
        )
