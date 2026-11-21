"""Aceptación sobre las muestras reales de SIU Guaraní.

Las muestras contienen datos personales del alumno, por eso viven en `tests/fixtures/private/`
(ignorada por git). Si no están, estos tests se saltan.
"""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.adapters.pdf_plan_reader import PdfPlanReader
from app.adapters.xls_plan_reader import XlsPlanReader
from app.domain.plan_parser import parse_plan
from app.domain.raw_plan import TableRow
from app.main import app

PRIVATE = Path(__file__).parents[1] / "fixtures" / "private"
PDF = PRIVATE / "plan_estudios.pdf"
XLS = PRIVATE / "plan_estudios.xls"

pytestmark = pytest.mark.skipif(
    not (PDF.exists() and XLS.exists()), reason="no están las muestras reales privadas"
)


def test_las_muestras_reales_tienen_61_materias_y_24_aprobadas() -> None:
    for reader, path in ((PdfPlanReader(), PDF), (XlsPlanReader(), XLS)):
        result = parse_plan(reader.read(path.read_bytes()))
        assert len(result.subjects) == 61
        approved = [s for s in result.subjects if s.status and s.status.kind == "approved"]
        assert len(approved) == 24
        assert all(s.status and s.status.condition == "Promocionado" for s in approved)
        assert all(s.year is None and s.prerequisites is None for s in result.subjects)
        assert all(s.code and s.credits is not None for s in result.subjects)
        assert sum(1 for s in result.subjects if s.is_elective) == 21


def test_pdf_y_xls_reales_producen_las_mismas_materias() -> None:
    from_pdf = parse_plan(PdfPlanReader().read(PDF.read_bytes()))
    from_xls = parse_plan(XlsPlanReader().read(XLS.read_bytes()))
    assert from_pdf.subjects == from_xls.subjects
    assert from_pdf.plan_info == from_xls.plan_info


def _student_name_tokens() -> list[str]:
    """Palabras del nombre del alumno, leídas de la línea "Alumno:" de la muestra XLS."""
    rows = XlsPlanReader().read(XLS.read_bytes()).blocks
    line = next(
        b.cells[0] for b in rows if isinstance(b, TableRow) and b.cells[0].startswith("Alumno:")
    )
    return [t for t in line.split(":", 1)[1].replace(",", " ").split() if len(t) > 2]


def test_la_respuesta_no_incluye_datos_personales_del_alumno() -> None:
    client = TestClient(app)
    tokens = _student_name_tokens()
    assert tokens
    for path in (PDF, XLS):
        response = client.post("/planes/extraccion", files={"file": (path.name, path.read_bytes())})
        assert response.status_code == 200
        text = json.dumps(response.json(), ensure_ascii=False)
        assert "Alumno" not in text and "Legajo" not in text
        assert not [t for t in tokens if t in text]
