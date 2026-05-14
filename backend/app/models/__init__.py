"""Importing this package registers every model on ``Base.metadata``."""

from app.models.order import Order  # noqa: F401

__all__ = ["Order"]
