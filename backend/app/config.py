import os

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Env keys tried in order when building the connection string (Easypanel / Docker).
_DATABASE_ENV_KEYS = (
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "SQL_DATABASE_URL",
)


class Settings(BaseSettings):
    """Dashboard API: PostgreSQL for orders (siwaky.com store DB)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = Field(
        default="",
        validation_alias="DATABASE_URL",
        description="postgres:// or postgresql:// URI",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def strip_database_url(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v


def load_settings() -> Settings:
    return Settings()


def resolved_database_url() -> str:
    """
    Effective DB URL for runtime. Re-reads os.environ so Easypanel injects after import,
    and falls back across common env names if the primary is missing or blank.
    """
    s = load_settings()
    for key in _DATABASE_ENV_KEYS:
        raw = os.environ.get(key)
        if raw is None:
            continue
        url = raw.strip()
        if url:
            return url
    # Pydantic-loaded default (e.g. from .env file)
    return (s.database_url or "").strip()
