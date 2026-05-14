import os

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Easypanel: Postgres service DNS name on the **project** Docker network (backend container → DB).
# Use `DATABASE_URL` env to override (e.g. local dev, or a different host).
DEFAULT_DATABASE_URL = "postgres://siwaky:siwaky@siwaky_database:5432/siwaky?sslmode=disable"

# Env keys tried in order when building the connection string.
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
    Prefer explicit env (Easypanel injects `DATABASE_URL`). If unset/blank everywhere,
    use DEFAULT_DATABASE_URL (internal `siwaky_database` on the panel network).
    """
    s = load_settings()
    for key in _DATABASE_ENV_KEYS:
        raw = os.environ.get(key)
        if raw and raw.strip():
            return raw.strip()
    pyd = (s.database_url or "").strip()
    if pyd:
        return pyd
    return DEFAULT_DATABASE_URL
