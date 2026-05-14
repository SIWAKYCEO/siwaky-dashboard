from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

OfferId = Literal["box-1", "box-2", "box-3"]


# Same regex as the frontend. KSA mobile only.
PHONE_PATTERN = r"^(?:\+?966|0)?(5(?:5|0|3|6|4|9|1|8|7))[0-9]{7}$"


class OrderCreate(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    phone: str = Field(min_length=9, max_length=20, pattern=PHONE_PATTERN)
    city: Optional[str] = Field(default=None, max_length=100)

    offer: OfferId
    quantity: int = Field(ge=1, le=3)
    price_sar: Decimal = Field(ge=0, max_digits=10, decimal_places=2)

    source: Optional[str] = Field(default=None, max_length=100)
    campaign: Optional[str] = Field(default=None, max_length=255)
    event_id: Optional[str] = Field(default=None, max_length=100)


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    status: str
    price_sar: Decimal
    event_id: Optional[str] = None
    created_at: Optional[datetime] = None
