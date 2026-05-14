from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SIWAKY_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    google_credentials_path: Path
    spreadsheet_id: str
    sheet_tab: str = "Sheet1"


def load_settings() -> Settings:
    return Settings()
