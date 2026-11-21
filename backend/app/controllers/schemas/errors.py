from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str = Field(description="Código estable del error, por ejemplo `invalid_file`")
    message: str = Field(description="Mensaje en español, sin detalles técnicos")


class ErrorResponse(BaseModel):
    """Formato de error único de la API."""

    error: ErrorDetail
