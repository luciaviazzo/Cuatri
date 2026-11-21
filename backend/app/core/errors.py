import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.domain.errors import DomainError

logger = logging.getLogger(__name__)

# El estado HTTP de cada error de dominio se decide acá, no en el dominio (Principio I).
_STATUS_BY_CODE: dict[str, int] = {
    "database_unavailable": 503,
    "empty_file": 400,
    "file_too_large": 413,
    "invalid_file": 422,
    "no_subjects_found": 422,
    "domain_invariant": 500,
}


def _error(status: int, code: str, message: str, details: object = None) -> JSONResponse:
    error: dict[str, object] = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return JSONResponse(status_code=status, content={"error": error})


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def domain_handler(_: Request, exc: DomainError) -> JSONResponse:
        return _error(_STATUS_BY_CODE.get(exc.code, 400), exc.code, str(exc))

    @app.exception_handler(StarletteHTTPException)
    async def http_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _error(exc.status_code, "http_error", str(exc.detail))

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = [{"loc": [str(p) for p in e["loc"]], "message": e["msg"]} for e in exc.errors()]
        return _error(422, "validation_error", "Datos de entrada inválidos", details)

    @app.exception_handler(Exception)
    async def unhandled_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Error no controlado", exc_info=exc)
        return _error(500, "internal_error", "Error interno del servidor")
