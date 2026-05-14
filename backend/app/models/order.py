from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
    func,
)

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    order_id: str = Column(String(50), unique=True, nullable=False, index=True)

    created_at: datetime = Column(DateTime(timezone=False), server_default=func.now(), nullable=False, index=True)
    updated_at: datetime = Column(
        DateTime(timezone=False),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    name: str = Column(String(255), nullable=False)
    phone: str = Column(String(20), nullable=False, index=True)
    city: Optional[str] = Column(String(100), nullable=True)

    product: str = Column(String(100), nullable=False, default="SIWAKY Box")
    offer: Optional[str] = Column(String(20), nullable=True)
    quantity: int = Column(Integer, nullable=False)
    price_sar: Decimal = Column(Numeric(10, 2), nullable=False)

    status: str = Column(String(50), nullable=False, default="pending", index=True)

    source: Optional[str] = Column(String(100), nullable=True)
    campaign: Optional[str] = Column(String(255), nullable=True)

    ip_address: Optional[str] = Column(String(45), nullable=True)
    user_agent: Optional[str] = Column(Text, nullable=True)
    event_id: Optional[str] = Column(String(100), nullable=True, index=True)
    notes: Optional[str] = Column(Text, nullable=True)
