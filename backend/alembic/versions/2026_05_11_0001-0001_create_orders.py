"""create orders

Revision ID: 0001
Revises:
Create Date: 2026-05-11 12:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("order_id", sa.String(length=50), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=False),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("product", sa.String(length=100), nullable=False, server_default="SIWAKY Box"),
        sa.Column("offer", sa.String(length=20), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("price_sar", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("source", sa.String(length=100), nullable=True),
        sa.Column("campaign", sa.String(length=255), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("event_id", sa.String(length=100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )

    op.create_index("ix_orders_order_id", "orders", ["order_id"], unique=True)
    op.create_index("ix_orders_phone", "orders", ["phone"])
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_index("ix_orders_created_at", "orders", ["created_at"])
    op.create_index("ix_orders_event_id", "orders", ["event_id"])


def downgrade() -> None:
    op.drop_index("ix_orders_event_id", table_name="orders")
    op.drop_index("ix_orders_created_at", table_name="orders")
    op.drop_index("ix_orders_status", table_name="orders")
    op.drop_index("ix_orders_phone", table_name="orders")
    op.drop_index("ix_orders_order_id", table_name="orders")
    op.drop_table("orders")
