"""SQLAlchemy engine, session and Base."""

from __future__ import annotations

import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def _build_url() -> str:
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. "
            "Add it as an environment variable in Easypanel: "
            "postgres://siwaky:siwaky@siwaky_database:5432/siwaky?sslmode=disable"
        )
    if url.startswith("postgres://"):
        url = "postgresql+psycopg2://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and "+" not in url.split(":", 1)[0]:
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


engine = create_engine(
    _build_url(),
    pool_pre_ping=True,
    pool_recycle=1800,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Base class for ORM models."""


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
