from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile

from app.controllers.schemas.errors import ErrorResponse
from app.controllers.schemas.plan_extraction import ExtraccionResponse
from app.core.config import get_settings
from app.core.wiring import get_extraccion_plan_service
from app.services.extraccion_plan_service import ExtraccionPlanService

router = APIRouter(prefix="/planes", tags=["planes"])


@router.post(
    "/extraccion",
    response_model=ExtraccionResponse,
    summary="Extraer las materias de un plan de estudios (PDF o Excel .xls)",
    responses={
        400: {"model": ErrorResponse, "description": "Archivo vacío (`empty_file`)"},
        413: {"model": ErrorResponse, "description": "Tamaño excedido (`file_too_large`)"},
        422: {
            "model": ErrorResponse,
            "description": (
                "Formato no soportado o archivo inválido (`invalid_file`), ninguna materia "
                "encontrada (`no_subjects_found`) o falta el campo `file` (`validation_error`)"
            ),
        },
    },
)
def extract_plan(
    file: UploadFile,
    service: Annotated[ExtraccionPlanService, Depends(get_extraccion_plan_service)],
) -> ExtraccionResponse:
    """Devuelve un resultado de revisión; no guarda nada.

    El formato (PDF o Excel .xls) se identifica por el contenido, no por la extensión. El
    nombre y el legajo del alumno que aparecen en el reporte no se devuelven ni se registran.
    """
    # Se lee un byte de más para que el Service pueda detectar que se excedió el máximo
    # sin cargar en memoria un archivo enorme.
    content = file.file.read(get_settings().max_upload_bytes + 1)
    return ExtraccionResponse.from_domain(service.extract(content))
