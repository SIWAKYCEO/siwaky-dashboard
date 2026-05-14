"""Database URL resolution for the dashboard backend (PostgreSQL)."""

from __future__ import annotations

import logging
import os
import threading
from typing import Optional
from urllib.parse import quote

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.services.orders_db import ping_database

logger = logging.getLogger(__name__)


def _q_ident(s: str) -> str:
    """Encode user/password for postgres:// URI."""
    return quote(s, safe="")


def _easypanel_builtin_fallback_urls() -> tuple[str, ...]:
    """Default hostnames when nothing else connects (Easypanel / Compose). Safe if extended empty."""
    return (
        "postgres://siwaky:siwaky@siwaky_database:5432/siwaky?sslmode=disable",
        "postgres://siwaky:siwaky@postgres:5432/siwaky?sslmode=disable",
        "postgres://siwaky:siwaky@postgresql:5432/siwaky?sslmode=disable",
        "postgres://siwaky:siwaky@db:5432/siwaky?sslmode=disable",
    )


_LOCK = threading.Lock()
_WORKING_URL: Optional[str] = None
_WORKING_SOURCE: Optional[str] = None
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


def selected_database_source() -> Optional[str]:
    """Label for which config path won (after resolution)."""
    _ensure_resolved()
    return _WORKING_SOURCE


def _urls_from_discrete_postgres_env() -> list[tuple[str, str]]:
    """
    Easypanel may expose host, user, password, db separately.
    Returns (label, url) pairs.
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
    url = f"postgres://{u}:{p}@{host}:{port}/{db}?sslmode={sslmode}"
    return [("built_from:POSTGRES_HOST", url)]


def _collect_labeled_candidates() -> list[tuple[str, str]]:
    """
    Ordered candidates: DATABASE_URL env first, then alternate env URLs, discrete parts,
    pydantic `.env`, comma fallbacks, then built-in Easypanel defaults.
    """
    items: list[tuple[str, str]] = []

    # 1) Highest priority: process env DATABASE_URL (Easypanel internal string, etc.)
    env_database_url = os.environ.get("DATABASE_URL", "").strip()
    if env_database_url:
        items.append(("env:DATABASE_URL", env_database_url))

    # 2) Other common full-URL env keys
    for key in ("POSTGRES_URL", "POSTGRES_PRISMA_URL", "SQL_DATABASE_URL"):
        raw = os.environ.get(key, "").strip()
        if raw:
            items.append((f"env:{key}", raw))

    # 3) Discrete POSTGRES_* / PG* → single URL
    items.extend(_urls_from_discrete_postgres_env())

    # 4) pydantic-settings (e.g. from `.env` in image)
    pyd = (load_settings().database_url or "").strip()
    if pyd:
        items.append(("pydantic_settings:DATABASE_URL", pyd))

    # 5) Extra comma-separated URLs
    extra = os.environ.get("DATABASE_URL_FALLBACKS", "").strip()
    if extra:
        for i, u in enumerate(x.strip() for x in extra.split(",") if x.strip()):
            items.append((f"env:DATABASE_URL_FALLBACKS[{i}]", u))

    # 6) Built-ins — via function only (never rely on an undefined module global)
    try:
        builtins = _easypanel_builtin_fallback_urls()
    except Exception:  # pragma: no cover — defensive
        builtins = ()

    if builtins:
        for i, url in enumerate(builtins):
            u = url.strip()
            if u:
                items.append((f"builtin_fallback[{i}]", u))

    # Dedupe by URL string, keep first label (preserves DATABASE_URL priority)
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    for label, url in items:
        if not url or url in seen:
            continue
        seen.add(url)
        out.append((label, url))
    return out


def _ensure_resolved() -> None:
    """Probe candidates once per process."""
    global _WORKING_URL, _WORKING_SOURCE, _RESOLUTION_ERR, _RESOLVED
    if _RESOLVED:
        return
    with _LOCK:
        if _RESOLVED:
            return
        candidates = _collect_labeled_candidates()
        if not candidates:
            _WORKING_URL = None
            _WORKING_SOURCE = None
            _RESOLUTION_ERR = (
                "No database URL configured. Set DATABASE_URL or POSTGRES_* / DATABASE_URL_FALLBACKS."
            )
            _RESOLVED = True
            logger.warning("[db] %s", _RESOLUTION_ERR)
            return

        parts: list[str] = []
        for label, url in candidates:
            try:
                ok, err = ping_database(url)
            except Exception as exc:  # do not crash on probe
                ok, err = False, str(exc)
            if ok:
                _WORKING_URL = url
                _WORKING_SOURCE = label
                _RESOLUTION_ERR = None
                _RESOLVED = True
                logger.info(
                    "[db] connected using source=%s url=%s",
                    label,
                    _redact_database_url(url),
                )
                return
            parts.append(f"{label}:{_redact_database_url(url)} → {err or 'failed'}")

        _WORKING_URL = None
        _WORKING_SOURCE = None
        _RESOLUTION_ERR = " | ".join(parts) if parts else "all_candidates_failed"
        _RESOLVED = True
        logger.error("[db] no working candidate: %s", _RESOLUTION_ERR)


def resolved_database_url() -> str:
    _ensure_resolved()
    return _WORKING_URL or ""


def last_database_resolution_error() -> Optional[str]:
    _ensure_resolved()
    return _RESOLUTION_ERR


def selected_database_url_redacted() -> Optional[str]:
    _ensure_resolved()
    return _redact_database_url(_WORKING_URL) if _WORKING_URL else None
