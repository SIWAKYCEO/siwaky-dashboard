import os

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Public Postgres for store orders (dashboard stack has no `siwaky_database` hostname).
DEFAULT_DATABASE_URL = "postgresql://siwaky:siwaky@187.124.3.192:5432/siwaky"

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
    Effective DB URL for runtime. Uses env when set to a usable URL; ignores Docker-internal
    hostnames that are not reachable from this network. Otherwise uses DEFAULT_DATABASE_URL.
    """
    s = load_settings()
    candidates: list[str] = []
    for key in _DATABASE_ENV_KEYS:
        raw = os.environ.get(key)
        if raw and raw.strip():
            candidates.append(raw.strip())
    pyd = (s.database_url or "").strip()
    if pyd:
        candidates.append(pyd)
    for url in candidates:
        if "siwaky_database" in url:
            continue
        return url
    return DEFAULT_DATABASE_URL
