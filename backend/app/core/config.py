from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://cuatri:cuatri@localhost:5432/cuatri"
    # Orígenes permitidos para CORS, separados por coma.
    cors_origins: str = "http://localhost:5173"
    environment: str = "local"
    # Tamaño máximo del archivo de plan a extraer (10 MB por defecto).
    max_upload_bytes: int = 10 * 1024 * 1024

    @field_validator("database_url")
    @classmethod
    def _use_psycopg_driver(cls, value: str) -> str:
        # Render/Railway entregan postgres:// o postgresql://; SQLAlchemy necesita el driver.
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return "postgresql+psycopg://" + value[len(prefix) :]
        return value

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
