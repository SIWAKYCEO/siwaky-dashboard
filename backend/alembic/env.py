from __future__ import annotations

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool


config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _get_url() -> str:
    """
    Read DATABASE_URL from the environment directly, then normalise the
    scheme so SQLAlchemy 2 / psycopg2 accepts it.

    Easypanel sets DATABASE_URL as  postgres://user:pass@host:5432/db
    SQLAlchemy 2 needs                postgresql+psycopg2://...
    """
    url = (
        os.environ.get("DATABASE_URL")
        or config.get_main_option("sqlalchemy.url", "")
    )
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. "
            "Export it as an environment variable before running alembic."
        )
    if url.startswith("postgres://"):
        url = "postgresql+psycopg2://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and "+" not in url.split(":", 1)[0]:
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


# Import models so Alembic sees them in target_metadata
from app.database import Base  # noqa: E402
from app import models          # noqa: F401, E402

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=_get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(_get_url(), poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
