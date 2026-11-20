from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.wiring import get_health_service
from app.services.health_service import HealthService

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    database: str


@router.get("/health", response_model=HealthResponse)
def health(service: Annotated[HealthService, Depends(get_health_service)]) -> HealthResponse:
    service.check()
    return HealthResponse(status="ok", database="up")
