"""Interpretación del reporte "Plan de estudios": convierte un `RawPlan` en un resultado de dominio.

Es lógica de negocio pura: no conoce PDF, Excel, HTTP ni bases de datos. Las reglas son
conservadoras: ante la duda, un dato queda sin asignar o como texto literal, nunca inventado.
"""

import re
from decimal import Decimal

from app.domain.plan_extraction import (
    EstadoExtraido,
    MateriaExtraida,
    PlanInfo,
    Requisito,
    ResultadoExtraccion,
)
from app.domain.raw_plan import RawPlan, TableRow, TextLine
from app.domain.text_cleaning import clean_text, normalize_key

# Condiciones entre paréntesis que se reconocen como aprobación (sin tildes, en minúsculas).
_APPROVING_CONDITIONS = frozenset({"promocionado", "aprobado"})
_NO_PREREQUISITES = frozenset({"-", "ninguna", "sin correlativas"})

_NUMBER = r"\d+(?:[.,]\d+)?"
_CREDITS = re.compile(rf"^{_NUMBER}$")
_GRADE_WITH_CONDITION = re.compile(rf"^({_NUMBER})\s*\((.+)\)$")
_NAME_AND_CODE = re.compile(r"^(?P<name>.*?)\s*\((?P<code>[^()\s]+)\)$")
_SHARED_ELECTIVE_MARKS = re.compile(r"(?:\s*\((?:\*|-|!)\))+$")
_PROGRAM_CODE = re.compile(r"^\(\w+\)\s*")
_PLAN_PART = re.compile(r"\s+Plan:\s*", re.IGNORECASE)
_VERSION_WITH_YEAR = re.compile(r"^\d{4}-(.+)$")

_COLUMN_ALIASES = {
    "actividad": "activity",
    "tipo": "type",
    "ano": "year",
    "periodo": "term",
    "nota": "note",
    "origen": "origin",
    "creditos": "credits",
    "correlativas": "prerequisites",
    "requisitos": "prerequisites",
}


def parse_plan(raw: RawPlan) -> ResultadoExtraccion:
    """Extrae las materias y los datos del plan. Lanza `NoSubjectsFoundError` si no hay ninguna."""
    group: str | None = None
    is_elective = False
    columns: dict[str, int] | None = None
    header_lines: list[str] = []
    subjects: list[MateriaExtraida] = []

    for block in raw.blocks:
        raw_cells = _cells_of(block)
        if _is_blank(raw_cells):
            continue
        text = _single_text(block, raw_cells)
        if text is not None:
            heading = _parse_heading(text)
            if heading is not None:
                group, is_elective = heading
                columns = None
            else:
                header_lines.append(text)
            continue
        cells = [clean_text(c) for c in raw_cells]
        found_columns = _header_columns(cells)
        if found_columns is not None:
            columns = found_columns
            continue
        if columns is None:
            continue
        subject = _row_to_subject(raw_cells, columns, group, is_elective)
        if subject is not None:
            subjects.append(subject)

    return ResultadoExtraccion.build(_plan_info(header_lines), subjects)


def _cells_of(block: TableRow | TextLine) -> tuple[str, ...]:
    return block.cells if isinstance(block, TableRow) else (block.text,)


def _is_blank(cells: tuple[str, ...]) -> bool:
    return not any(clean_text(c) for c in cells)


def _single_text(block: TableRow | TextLine, cells: tuple[str, ...]) -> str | None:
    """Devuelve el texto si el bloque es una línea de texto o una fila con una sola celda."""
    filled = [clean_text(c) for c in cells if clean_text(c)]
    if isinstance(block, TextLine) or len(filled) == 1:
        return " ".join(filled)
    return None


def _parse_heading(text: str) -> tuple[str | None, bool] | None:
    key = normalize_key(text)
    if key.startswith("materia generica:"):
        elective = True
    elif key.startswith("modulo:"):
        elective = False
    else:
        return None
    segments = [s for s in (clean_text(p) for p in text.split(":", 1)[1].split("/")) if s]
    # El segmento raíz "Plan basico" está en el título del XLS pero no siempre en el del PDF.
    if segments and normalize_key(segments[0]) == "plan basico":
        segments = segments[1:]
    label = " / ".join(segments)
    return (label or None), elective


def _header_columns(cells: list[str]) -> dict[str, int] | None:
    keys = [normalize_key(c) for c in cells]
    if "actividad" not in keys:
        return None
    columns: dict[str, int] = {}
    for index, key in enumerate(keys):
        name = _COLUMN_ALIASES.get(key)
        if name is not None and name not in columns:
            columns[name] = index
    return columns


def _cell(cells: tuple[str, ...], columns: dict[str, int], name: str) -> str | None:
    index = columns.get(name)
    if index is None or index >= len(cells):
        return None
    return clean_text(cells[index]) or None


def _row_to_subject(
    raw_cells: tuple[str, ...], columns: dict[str, int], group: str | None, is_elective: bool
) -> MateriaExtraida | None:
    activity = _cell(raw_cells, columns, "activity")
    if activity is None:
        return None
    name, code = _split_activity(activity)
    if not name:
        return None
    return MateriaExtraida(
        name=name,
        code=code,
        activity_type=_cell(raw_cells, columns, "type"),
        credits=_parse_credits(_cell(raw_cells, columns, "credits")),
        group=group,
        is_elective=is_elective,
        year=None,
        reported_year=_cell(raw_cells, columns, "year"),
        reported_term=_cell(raw_cells, columns, "term"),
        origin=_cell(raw_cells, columns, "origin"),
        prerequisites=_parse_prerequisites(_raw_cell(raw_cells, columns, "prerequisites")),
        status=_parse_status(_cell(raw_cells, columns, "note")),
    )


def _raw_cell(cells: tuple[str, ...], columns: dict[str, int], name: str) -> str | None:
    index = columns.get(name)
    if index is None or index >= len(cells):
        return None
    return cells[index]


def _split_activity(activity: str) -> tuple[str, str | None]:
    without_marks = _SHARED_ELECTIVE_MARKS.sub("", activity)
    match = _NAME_AND_CODE.match(without_marks)
    if match is None:
        return clean_text(without_marks), None
    return clean_text(match.group("name")), match.group("code")


def _parse_credits(value: str | None) -> Decimal | None:
    if value is None or not _CREDITS.match(value):
        return None
    return Decimal(value.replace(",", "."))


def _parse_status(value: str | None) -> EstadoExtraido | None:
    if value is None:
        return None
    if normalize_key(value) == "en curso":
        return EstadoExtraido("in_progress")
    match = _GRADE_WITH_CONDITION.match(value)
    if match is not None:
        grade = Decimal(match.group(1).replace(",", "."))
        condition = clean_text(match.group(2))
        if normalize_key(condition) in _APPROVING_CONDITIONS and grade <= 10:
            return EstadoExtraido("approved", grade=grade, condition=condition)
    return EstadoExtraido("unparsed", text=value)


def _parse_prerequisites(value: str | None) -> tuple[Requisito, ...] | None:
    """None = sin determinar; vacío = confirmado sin correlativas; con ítems = lista detectada."""
    if value is None or not clean_text(value):
        return None
    if normalize_key(value) in _NO_PREREQUISITES:
        return ()
    items = [clean_text(part) for part in value.split(";")]
    return tuple(
        Requisito("subject" if _NAME_AND_CODE.match(item) else "unparsed", item)
        for item in items
        if item
    )


def _plan_info(lines: list[str]) -> PlanInfo:
    program: str | None = None
    plan: str | None = None
    version: str | None = None
    for line in lines:
        key = normalize_key(line)
        if key.startswith("propuesta:"):
            rest = line.split(":", 1)[1].strip()
            parts = _PLAN_PART.split(rest, maxsplit=1)
            program = program or (_PROGRAM_CODE.sub("", parts[0]).strip() or None)
            if len(parts) == 2:
                plan = plan or _plan_value(parts[1])
        elif key.startswith("plan:"):
            plan = plan or _plan_value(line.split(":", 1)[1])
        elif key.startswith("version:"):
            version = version or _version_value(line.split(":", 1)[1])
    return PlanInfo(program=program, plan=plan, version=version)


def _plan_value(value: str) -> str | None:
    value = value.strip()
    inner = re.match(r"^\(([^()]+)\)", value)
    if inner is not None:
        return inner.group(1).strip() or None
    return (value.split()[0] if value else None) or None


def _version_value(value: str) -> str | None:
    value = value.strip()
    match = _VERSION_WITH_YEAR.match(value)
    return (match.group(1) if match else value) or None
