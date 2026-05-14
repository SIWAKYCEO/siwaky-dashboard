"""Canonical bundle definitions — keep in sync with frontend ``lib/offers.ts``."""

from __future__ import annotations

from decimal import Decimal
from typing import Literal

OfferId = Literal["box-1", "box-2", "box-3"]

# offer_id -> (boxes in bundle, price SAR, product label for DB / Sheets)
OFFER_DETAILS: dict[OfferId, tuple[int, Decimal, str]] = {
    "box-1": (1, Decimal("245.00"), "SIWAKY Box x1"),
    "box-2": (2, Decimal("299.00"), "SIWAKY Box x2"),
    "box-3": (3, Decimal("349.00"), "SIWAKY Box x3"),
}


def resolve_offer(offer_id: OfferId) -> tuple[int, Decimal, str]:
    return OFFER_DETAILS[offer_id]
