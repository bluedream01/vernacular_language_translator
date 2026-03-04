from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict
BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        case_sensitive=True,
        extra="ignore",
    )

    API_V1_STR: str = "/VLT/content/v1"

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://localhost:3000",
        "https://localhost:8000",
        "http://localhost:5173",
        "https://localhost:5173",
    ]

    PROJECT_NAME: str = "Vernacular Language Translator Platform APIs"

    # Required environment variables
    MONGODB_URL: str
    MONGODB_DB_NAME: str


settings = Settings()