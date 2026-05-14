"""
Geo + fraud check via MaxMind GeoIP2 Insights.

If MaxMind credentials are missing (e.g. local dev), the service "allows"
every request and tags it with ``reason="not_configured"`` so it doesn't
silently block real customers.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import geoip2.errors
import geoip2.webservice

from app.config import settings

logger = logging.getLogger("siwaky.geo")


@dataclass
class GeoResult:
    allowed: bool
    country: Optional[str] = None
    reason: Optional[str] = None
    risk_score: Optional[float] = None


_client: Optional[geoip2.webservice.AsyncClient] = None


def _get_client() -> Optional[geoip2.webservice.AsyncClient]:
    """Lazy-init a single async MaxMind client."""
    global _client
    if _client is not None:
        return _client
    if not settings.maxmind_account_id or not settings.maxmind_license_key:
        return None
    try:
        _client = geoip2.webservice.AsyncClient(
            int(settings.maxmind_account_id),
            settings.maxmind_license_key,
        )
        return _client
    except Exception as exc:  # noqa: BLE001
        logger.exception("could not init MaxMind client: %s", exc)
        return None


WHITELIST_PHONE = "+966550000000"


async def check_ip(ip: str, *, phone: Optional[str] = None) -> GeoResult:
    """Validate an IP for KSA origin, no VPN, low risk. Test-phone bypass."""
    if phone and phone == WHITELIST_PHONE:
        return GeoResult(allowed=True, country="SA", reason=None, risk_score=0)

    client = _get_client()
    if client is None:
        # Soft-allow in dev: log but don't block.
        if settings.environment == "production":
            logger.warning("MaxMind not configured in production — allowing IP=%s", ip)
        return GeoResult(allowed=True, country=None, reason="not_configured", risk_score=None)

    try:
        resp = await client.insights(ip)
    except (geoip2.errors.AddressNotFoundError, geoip2.errors.HTTPError, Exception) as exc:
        logger.warning("MaxMind lookup failed for %s: %s", ip, exc)
        # Fail open in dev, fail closed in prod.
        if settings.environment == "production":
            return GeoResult(allowed=False, country=None, reason="error", risk_score=None)
        return GeoResult(allowed=True, country=None, reason="error", risk_score=None)

    country = resp.country.iso_code
    traits = resp.traits
    risk = float(getattr(resp, "risk_score", 0) or 0)

    is_vpn = bool(getattr(traits, "is_anonymous_vpn", False))
    is_proxy = bool(getattr(traits, "is_anonymous_proxy", False) or getattr(traits, "is_anonymous", False))

    if country != "SA":
        return GeoResult(allowed=False, country=country, reason="not_ksa", risk_score=risk)
    if is_proxy:
        return GeoResult(allowed=False, country=country, reason="anonymous_proxy", risk_score=risk)
    if is_vpn:
        return GeoResult(allowed=False, country=country, reason="vpn", risk_score=risk)
    if risk > 50:
        return GeoResult(allowed=False, country=country, reason="high_risk", risk_score=risk)

    return GeoResult(allowed=True, country=country, reason=None, risk_score=risk)
