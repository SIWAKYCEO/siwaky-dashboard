import os
import threading
from typing import Optional
from urllib.parse import quote

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.services.orders_db import ping_database


def _q_ident(s: str) -> str:
    """Encode user/password for postgres:// URI."""
    return quote(s, safe="")

# Env keys tried first (highest priority).
_DATABASE_ENV_KEYS = (
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "SQL_DATABASE_URL",
)

# Tried in order only if no env URL works — different Easypanel / Compose service names.
_BUILTIN_FALLBACKS: tuple[str, ...] = (
    "postgres://siwaky:siwaky@siwaky_database:5432/siwaky?sslmode=disable",
    "postgres://siwaky:siwaky@postgres:5432/siwaky?sslmode=disable",
    "postgres://siwaky:siwaky@postgresql:5432/siwaky?sslmode=disable",
    "postgres://siwaky:siwaky@db:5432/siwaky?sslmode=disable",
)

_LOCK = threading.Lock()
_WORKING_URL: Optional[str] = None
_RESOLUTION_ERR: Optional[str] = None
_RESOLVED: bool = False


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


def _redact_database_url(url: str) -> str:
    if "@" not in url or "://" not in url:
        return url
    try:
        scheme, rest = url.split("://", 1)
        if "@" in rest:
            _, hostpart = rest.rsplit("@", 1)
            return f"{scheme}://***@{hostpart}"
    except Exception:
        return "***"
    return url


def _urls_from_discrete_postgres_env() -> list[str]:
    """
    Easypanel / Docker often expose host, user, password, db separately.
    Set POSTGRES_HOST (or PGHOST) and optionally POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT.
    """
    host = (os.environ.get("POSTGRES_HOST") or os.environ.get("PGHOST") or "").strip()
    if not host:
        return []
    user = (os.environ.get("POSTGRES_USER") or os.environ.get("PGUSER") or "siwaky").strip()
    password = (os.environ.get("POSTGRES_PASSWORD") or os.environ.get("PGPASSWORD") or "siwaky").strip()
    db = (os.environ.get("POSTGRES_DB") or os.environ.get("PGDATABASE") or "siwaky").strip()
    port = (os.environ.get("POSTGRES_PORT") or os.environ.get("PGPORT") or "5432").strip()
    sslmode = (os.environ.get("POSTGRES_SSLMODE") or os.environ.get("PGSSLMODE") or "disable").strip()
    u, p = _q_ident(user), _q_ident(password)
    return [f"postgres://{u}:{p}@{host}:{port}/{db}?sslmode={sslmode}"]


def _collect_candidate_urls() -> list[str]:
    urls: list[str] = []
    for key in _DATABASE_ENV_KEYS:
        raw = os.environ.get(key, "").strip()
        if raw:
            urls.append(raw)
    # Host-only config: try after full URLs (Easypanel may paste internal IP / hostname here).
    for u in _urls_from_discrete_postgres_env():
        urls.append(u)
    pyd = (load_settings().database_url or "").strip()
    if pyd:
        urls.append(pyd)
    extra = os.environ.get("DATABASE_URL_FALLBACKS", "").strip()
    if extra:
        urls.extend(u.strip() for u in extra.split(",") if u.strip())
    urls.extend(_BUILT_IN_FALLBACKS)
    seen: set[str] = set()
    out: list[str] = []
    for u in urls:
        if u and u not in seen:
            seen.add(u)
            out.append(u)
    return out


def _ensure_resolved() -> None:
    """Probe candidates once per process; set _WORKING_URL or _RESOLUTION_ERR."""
    global _WORKING_URL, _RESOLUTION_ERR, _RESOLVED
    if _RESOLVED:
        return
    with _LOCK:
        if _RESOLVED:
            return
        candidates = _collect_candidate_urls()
        if not candidates:
            _RESOLUTION_ERR = "No DATABASE_URL configured and no built-in fallbacks."
            _RESOLVED = True
            return
        parts: list[str] = []
        for url in candidates:
            ok, err = ping_database(url)
            if ok:
                _WORKING_URL = url
                _RESOLUTION_ERR = None
                _RESOLVED = True
                return
            parts.append(f"{_redact_database_url(url)} → {err or 'failed'}")
        _WORKING_URL = None
        _RESOLUTION_ERR = " | ".join(parts)
        _RESOLVED = True


def resolved_database_url() -> str:
    """Postgres URL that works from this container (cached after first probe)."""
    _ensure_resolved()
    return _WORKING_URL or ""


def last_database_resolution_error() -> Optional[str]:
    """Populated when no candidate URL could connect."""
    _ensure_resolved()
    return _RESOLUTION_ERR


def selected_database_url_redacted() -> Optional[str]:
    _ensure_resolved()
    return _redact_database_url(_WORKING_URL) if _WORKING_URL else None
