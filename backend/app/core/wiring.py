"""Composición de dependencias: único lugar que conecta services con repositories."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.adapters.pdf_plan_reader import PdfPlanReader
from app.adapters.xls_plan_reader import XlsPlanReader
from app.core.config import get_settings
from app.core.database import get_db
from app.domain.file_format import FileFormat
from app.repositories.health_repository import HealthRepository
from app.services.extraccion_plan_service import ExtraccionPlanService
from app.services.health_service import HealthService


def get_health_service(db: Annotated[Session, Depends(get_db)]) -> HealthService:
    return HealthService(HealthRepository(db))


def get_extraccion_plan_service() -> ExtraccionPlanService:
    return ExtraccionPlanService(
        readers={FileFormat.PDF: PdfPlanReader(), FileFormat.XLS: XlsPlanReader()},
        max_upload_bytes=get_settings().max_upload_bytes,
    )
