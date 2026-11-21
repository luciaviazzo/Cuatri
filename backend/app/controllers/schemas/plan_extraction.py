from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.domain.plan_extraction import (
    EstadoExtraido,
    MateriaExtraida,
    PlanInfo,
    Requisito,
    ResultadoExtraccion,
)


class RequisitoSchema(BaseModel):
    kind: Literal["subject", "unparsed"] = Field(
        description="`subject`: otra materia (Nombre (CÓDIGO)); `unparsed`: texto no interpretado"
    )
    text: str

    @classmethod
    def from_domain(cls, requisito: Requisito) -> "RequisitoSchema":
        return cls(kind=requisito.kind, text=requisito.text)


class EstadoSchema(BaseModel):
    kind: Literal["approved", "in_progress", "unparsed"]
    grade: Decimal | None = Field(default=None, description="Nota (solo si está aprobada)")
    condition: str | None = Field(default=None, description="Por ejemplo `Promocionado`")
    text: str | None = Field(default=None, description="Texto literal si no se interpretó")

    @classmethod
    def from_domain(cls, estado: EstadoExtraido) -> "EstadoSchema":
        return cls(
            kind=estado.kind, grade=estado.grade, condition=estado.condition, text=estado.text
        )


class MateriaSchema(BaseModel):
    code: str | None
    name: str
    activity_type: str | None
    credits: Decimal | None
    group: str | None = Field(description="Módulo o bloque donde figura la materia")
    is_elective: bool = Field(description="Verdadero si figura en un bloque `Materia genérica`")
    year: int | None = Field(description="Año del plan; `null` = sin asignar")
    reported_year: str | None
    reported_term: str | None
    origin: str | None
    prerequisites: list[RequisitoSchema] | None = Field(
        description="`null` = sin determinar; `[]` = confirmado sin correlativas"
    )
    status: EstadoSchema | None = Field(description="`null` = sin nota ni estado")

    @classmethod
    def from_domain(cls, materia: MateriaExtraida) -> "MateriaSchema":
        return cls(
            code=materia.code,
            name=materia.name,
            activity_type=materia.activity_type,
            credits=materia.credits,
            group=materia.group,
            is_elective=materia.is_elective,
            year=materia.year,
            reported_year=materia.reported_year,
            reported_term=materia.reported_term,
            origin=materia.origin,
            prerequisites=(
                None
                if materia.prerequisites is None
                else [RequisitoSchema.from_domain(r) for r in materia.prerequisites]
            ),
            status=None if materia.status is None else EstadoSchema.from_domain(materia.status),
        )


class PlanInfoSchema(BaseModel):
    program: str | None
    plan: str | None
    version: str | None

    @classmethod
    def from_domain(cls, info: PlanInfo) -> "PlanInfoSchema":
        return cls(program=info.program, plan=info.plan, version=info.version)


class ExtraccionResponse(BaseModel):
    """Resultado de revisión: no se guarda en ningún lado."""

    plan_info: PlanInfoSchema
    subjects: list[MateriaSchema]

    @classmethod
    def from_domain(cls, result: ResultadoExtraccion) -> "ExtraccionResponse":
        return cls(
            plan_info=PlanInfoSchema.from_domain(result.plan_info),
            subjects=[MateriaSchema.from_domain(s) for s in result.subjects],
        )
