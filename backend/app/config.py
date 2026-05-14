import json
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Dashboard API: Google Sheets credentials and spreadsheet id."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    google_service_account_json: str = ""
    google_sheets_spreadsheet_id: str = ""

    @field_validator("google_service_account_json", mode="before")
    @classmethod
    def strip_json(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("google_sheets_spreadsheet_id", mode="before")
    @classmethod
    def strip_sid(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v

    def service_account_info(self) -> dict[str, Any]:
        raw = self.google_service_account_json
        if not raw:
            raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON is empty")
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON must be a JSON object")
        return data


def load_settings() -> Settings:
    return Settings()
