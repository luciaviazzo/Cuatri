from pathlib import Path

from app.adapters.xls_plan_reader import XlsPlanReader
from app.domain.raw_plan import TableRow
from tests.fixtures.make_plan_fixtures import EXPECTED_SUBJECT_COUNT

FIXTURE = Path(__file__).parents[2] / "fixtures" / "plan_sintetico.xls"


def test_emite_las_filas_no_vacias_con_todas_las_celdas_como_texto() -> None:
    raw = XlsPlanReader().read(FIXTURE.read_bytes())
    rows = [b for b in raw.blocks if isinstance(b, TableRow)]
    first = next(r for r in rows if r.cells[0].startswith("Lectura y Escritura"))
    assert first.cells[:8] == (
        "Lectura y Escritura Académica (80000)",
        "Materia",
        "",
        "",
        "9 (Promocionado)",
        "Promoción",
        "10.00",
        "",
    )


def test_cuenta_todas_las_materias() -> None:
    raw = XlsPlanReader().read(FIXTURE.read_bytes())
    subjects = [
        b
        for b in raw.blocks
        if isinstance(b, TableRow) and len(b.cells) > 1 and b.cells[1] == "Materia"
    ]
    assert len(subjects) == EXPECTED_SUBJECT_COUNT


def test_incluye_titulos_y_encabezado_como_filas() -> None:
    raw = XlsPlanReader().read(FIXTURE.read_bytes())
    firsts = [b.cells[0] for b in raw.blocks if isinstance(b, TableRow)]
    assert any(t.startswith("MÓDULO:") for t in firsts)
    assert any(t.startswith("MATERIA GENÉRICA:") for t in firsts)
    assert any(t.startswith("Propuesta:") for t in firsts)
