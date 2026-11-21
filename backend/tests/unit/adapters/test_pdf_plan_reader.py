from pathlib import Path

from app.adapters.pdf_plan_reader import PdfPlanReader
from app.domain.raw_plan import TableRow, TextLine
from tests.fixtures.make_plan_fixtures import EXPECTED_SUBJECT_COUNT

FIXTURE = Path(__file__).parents[2] / "fixtures" / "plan_sintetico.pdf"


def test_emite_filas_de_tabla_con_todas_las_celdas_incluidas_las_vacias() -> None:
    raw = PdfPlanReader().read(FIXTURE.read_bytes())
    rows = [b for b in raw.blocks if isinstance(b, TableRow)]
    first = next(r for r in rows if r.cells[0].startswith("Lectura y Escritura"))
    assert first.cells == (
        "Lectura y Escritura Académica (80000)",
        "Materia",
        "",
        "",
        "9 (Promocionado)",
        "Promoción",
        "10.00",
        "",
    )


def test_cuenta_todas_las_materias_de_todas_las_paginas() -> None:
    raw = PdfPlanReader().read(FIXTURE.read_bytes())
    subjects = [b for b in raw.blocks if isinstance(b, TableRow) and b.cells[1] == "Materia"]
    assert len(subjects) == EXPECTED_SUBJECT_COUNT


def test_los_titulos_son_lineas_de_texto_antes_de_su_tabla_aun_entre_paginas() -> None:
    raw = PdfPlanReader().read(FIXTURE.read_bytes())
    blocks = list(raw.blocks)
    heading = next(
        i
        for i, b in enumerate(blocks)
        if isinstance(b, TextLine) and "Cursos Básicos de la carrera" in b.text
    )
    first_of_group = next(
        i
        for i, b in enumerate(blocks)
        if isinstance(b, TableRow) and b.cells[0].startswith("Análisis Matemático I")
    )
    assert heading < first_of_group


def test_incluye_el_encabezado_del_plan_como_lineas_de_texto() -> None:
    raw = PdfPlanReader().read(FIXTURE.read_bytes())
    texts = [b.text for b in raw.blocks if isinstance(b, TextLine)]
    assert any(t.startswith("Propuesta:") for t in texts)
    assert any(t.startswith("MATERIA GENÉRICA:") for t in texts)
