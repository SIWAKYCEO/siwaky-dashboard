from __future__ import annotations

from fastapi import APIRouter, Request

from app.services import geo_check

router = APIRouter()


@router.get("/check")
async def check(request: Request):
    ip = _client_ip(request)
    result = await geo_check.check_ip(ip)
    return {
        "allowed": result.allowed,
        "country": result.country,
        "reason": result.reason,
        "risk_score": result.risk_score,
        "ip": ip,
    }


def _client_ip(request: Request) -> str:
    """
    Take the first IP from `x-forwarded-for` (Easypanel sets this), falling back
    to the socket peer.
    """
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    return request.client.host if request.client else "0.0.0.0"
