"""Composición de dependencias: único lugar que conecta services con repositories."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.health_repository import HealthRepository
from app.services.health_service import HealthService


def get_health_service(db: Annotated[Session, Depends(get_db)]) -> HealthService:
    return HealthService(HealthRepository(db))
