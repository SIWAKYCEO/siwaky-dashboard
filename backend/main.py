"""Entry shim for uvicorn (`cd backend && uvicorn main:app ...`)."""

from app.main import app

__all__ = ["app"]
