from collections.abc import Iterable
from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from app.domain.errors import DomainInvariantError, NoSubjectsFoundError
from app.domain.text_cleaning import normalize_key


@dataclass(frozen=True, slots=True)
class Requisito:
    """Un requisito de una materia: otra materia (`subject`) o texto no interpretado."""

    kind: Literal["subject", "unparsed"]
    text: str

    def __post_init__(self) -> None:
        if not self.text.strip():
            raise DomainInvariantError("Un requisito no puede estar vacío")


@dataclass(frozen=True, slots=True)
class EstadoExtraido:
    kind: Literal["approved", "in_progress", "unparsed"]
    grade: Decimal | None = None
    condition: str | None = None
    text: str | None = None

    def __post_init__(self) -> None:
        if self.kind == "approved":
            if self.grade is None or not Decimal(0) <= self.grade <= Decimal(10):
                raise DomainInvariantError("Una materia aprobada requiere una nota entre 0 y 10")
            if self.text is not None:
                raise DomainInvariantError("Una materia aprobada no lleva texto literal")
        else:
            if self.grade is not None or self.condition is not None:
                raise DomainInvariantError("Solo una materia aprobada lleva nota y condición")
            if self.kind == "unparsed" and not (self.text or "").strip():
                raise DomainInvariantError("Un estado no interpretado requiere su texto literal")
            if self.kind == "in_progress" and self.text is not None:
                raise DomainInvariantError("Una materia en curso no lleva texto literal")


@dataclass(frozen=True, slots=True)
class MateriaExtraida:
    name: str
    code: str | None = None
    activity_type: str | None = None
    credits: Decimal | None = None
    group: str | None = None
    is_elective: bool = False
    # Año del plan: None = sin asignar. Nunca se deduce del módulo ni de Año/Período (FR-009).
    year: int | None = None
    reported_year: str | None = None
    reported_term: str | None = None
    origin: str | None = None
    # None = sin determinar; () = confirmado sin correlativas; con ítems = lista detectada.
    prerequisites: tuple[Requisito, ...] | None = None
    status: EstadoExtraido | None = None

    def __post_init__(self) -> None:
        if not self.name.strip():
            raise DomainInvariantError("Una materia requiere nombre")
        if self.code is not None and (not self.code or any(c.isspace() for c in self.code)):
            raise DomainInvariantError("El código de una materia no puede tener espacios")
        if self.credits is not None and self.credits < 0:
            raise DomainInvariantError("Los créditos no pueden ser negativos")
        if self.year is not None and self.year < 1:
            raise DomainInvariantError("El año del plan debe ser positivo")


@dataclass(frozen=True, slots=True)
class PlanInfo:
    program: str | None = None
    plan: str | None = None
    version: str | None = None


def subject_identity(subject: MateriaExtraida) -> str:
    """Identidad para deduplicar: el código si existe; si no, el nombre normalizado."""
    if subject.code:
        return f"code:{subject.code.casefold()}"
    return f"name:{normalize_key(subject.name)}"


@dataclass(frozen=True, slots=True)
class ResultadoExtraccion:
    plan_info: PlanInfo
    subjects: tuple[MateriaExtraida, ...]

    def __post_init__(self) -> None:
        if not self.subjects:
            raise NoSubjectsFoundError()
        identities = [subject_identity(s) for s in self.subjects]
        if len(set(identities)) != len(identities):
            raise DomainInvariantError("El resultado no puede tener materias duplicadas")

    @classmethod
    def build(
        cls, plan_info: PlanInfo, subjects: Iterable[MateriaExtraida]
    ) -> "ResultadoExtraccion":
        """Construye el resultado conservando la primera aparición de cada materia (FR-022)."""
        seen: set[str] = set()
        unique: list[MateriaExtraida] = []
        for subject in subjects:
            identity = subject_identity(subject)
            if identity not in seen:
                seen.add(identity)
                unique.append(subject)
        return cls(plan_info=plan_info, subjects=tuple(unique))
