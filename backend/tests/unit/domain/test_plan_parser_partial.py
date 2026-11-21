from pathlib import Path

import pytest

from app.adapters.pdf_plan_reader import PdfPlanReader
from app.adapters.xls_plan_reader import XlsPlanReader
from app.domain.plan_extraction import MateriaExtraida, Requisito
from app.domain.plan_parser import parse_plan
from app.domain.raw_plan import RawPlan, TableRow, TextLine

FIXTURES = Path(__file__).parents[2] / "fixtures"
HEADER = ("Actividad", "Tipo", "Año", "Período", "Nota", "Origen", "Créditos", "Correlativas")


def with_prerequisites(cell: str) -> MateriaExtraida:
    raw = RawPlan(
        (
            TextLine("MÓDULO: / A"),
            TableRow(HEADER),
            TableRow(("Materia X (1)", "Materia", "", "", "", "", "8.00", cell)),
        )
    )
    return parse_plan(raw).subjects[0]


def test_sin_columna_de_correlativas_quedan_sin_determinar() -> None:
    raw = RawPlan(
        (
            TextLine("MÓDULO: / A"),
            TableRow(("Actividad", "Tipo", "Nota")),
            TableRow(("Materia X (1)", "Materia", "")),
        )
    )
    assert parse_plan(raw).subjects[0].prerequisites is None


def test_celda_de_correlativas_vacia_es_sin_determinar_no_sin_correlativas() -> None:
    assert with_prerequisites("").prerequisites is None
    assert with_prerequisites("   ").prerequisites is None


@pytest.mark.parametrize("cell", ["Ninguna", "ninguna", "-", "Sin correlativas", " NINGUNA "])
def test_confirmado_sin_correlativas_solo_si_el_archivo_lo_dice(cell: str) -> None:
    assert with_prerequisites(cell).prerequisites == ()


def test_correlativas_con_forma_de_materia_son_subject() -> None:
    materia = with_prerequisites("Programación con Objetos II (01037); Matemática (8003N)")
    assert materia.prerequisites == (
        Requisito("subject", "Programación con Objetos II (01037)"),
        Requisito("subject", "Matemática (8003N)"),
    )


def test_requisito_que_no_es_una_materia_se_conserva_como_texto_literal() -> None:
    materia = with_prerequisites("Programación con Objetos II (01037); CBC aprobado")
    assert materia.prerequisites == (
        Requisito("subject", "Programación con Objetos II (01037)"),
        Requisito("unparsed", "CBC aprobado"),
    )


def test_no_se_valida_que_las_correlativas_existan_entre_las_materias() -> None:
    assert with_prerequisites("Materia Inexistente (99999)").prerequisites == (
        Requisito("subject", "Materia Inexistente (99999)"),
    )


def test_el_año_del_plan_nunca_se_deduce_de_anio_y_periodo() -> None:
    raw = RawPlan(
        (
            TextLine("MÓDULO: / Primer año"),
            TableRow(HEADER),
            TableRow(
                ("X (1)", "Materia", "2023", "2° Cuatrimestre", "9 (Promocionado)", "", "8", "")
            ),
        )
    )
    materia = parse_plan(raw).subjects[0]
    assert materia.year is None
    assert (materia.reported_year, materia.reported_term) == ("2023", "2° Cuatrimestre")


@pytest.mark.parametrize(
    "reader, name",
    [
        (PdfPlanReader(), "plan_con_correlativas.pdf"),
        (XlsPlanReader(), "plan_con_correlativas.xls"),
    ],
)
def test_archivo_con_correlativas_distingue_los_tres_estados(
    reader: PdfPlanReader | XlsPlanReader, name: str
) -> None:
    result = parse_plan(reader.read((FIXTURES / name).read_bytes()))
    by_code = {s.code: s for s in result.subjects}
    assert by_code["01051"].prerequisites == (
        Requisito("subject", "Programación con Objetos II (01037)"),
        Requisito("unparsed", "CBC aprobado"),
    )
    assert by_code["01309"].prerequisites == ()
    assert by_code["01310"].prerequisites is None
    assert all(s.year is None for s in result.subjects)
    assert by_code["80000"].reported_year == "2023"
    assert by_code["80000"].reported_term == "2° Cuatrimestre"


def test_un_resultado_con_datos_faltantes_es_valido() -> None:
    raw = RawPlan((TextLine("MÓDULO: / A"), TableRow(("Actividad",)), TableRow(("Sin nada",))))
    # Una fila de una sola celda es texto, no materia: sin materias es un rechazo, no un parcial.
    from app.domain.errors import NoSubjectsFoundError

    with pytest.raises(NoSubjectsFoundError):
        parse_plan(raw)
    parcial = RawPlan(
        (
            TextLine("MÓDULO: / A"),
            TableRow(("Actividad", "Tipo")),
            TableRow(("Solo nombre", "Materia")),
        )
    )
    (materia,) = parse_plan(parcial).subjects
    assert materia.credits is None and materia.status is None and materia.prerequisites is None
