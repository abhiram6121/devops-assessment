from functools import lru_cache
from typing import List, Optional
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- General -----------------------------------------------------------
    APP_NAME: str = "DevOps Assessment Dashboard"
    ENVIRONMENT: str = "development"

    # --- Database Parameters -----------------------------------------------
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    @property
    def DATABASE_URL(self) -> str:
        """Constructs the database connection string from parameters."""

        # URL-encode the password in case it contains special characters (@, #, $, etc.)
        encoded_password = quote_plus(self.DB_PASSWORD) if self.DB_PASSWORD else ""
        auth = f"{self.DB_USER}:{encoded_password}@" if self.DB_USER else ""
        return f"postgresql://{auth}{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # --- S3 / LocalStack ---------------------------------------------------
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: str
    S3_PUBLIC_ENDPOINT_URL: str
    S3_BUCKET_NAME: str
    PRESIGNED_URL_EXPIRATION_SECONDS: int = 300

    # --- CORS --------------------------------------------------------------
    CORS_ORIGINS: str

    @property
    def cors_origins_list(self) -> List[str]:
        return [
            origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
