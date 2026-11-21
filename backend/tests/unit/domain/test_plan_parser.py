from decimal import Decimal

from app.domain.plan_extraction import EstadoExtraido, PlanInfo
from app.domain.plan_parser import parse_plan
from app.domain.raw_plan import RawPlan, TableRow, TextLine

HEADER = ("Actividad", "Tipo", "Año", "Período", "Nota", "Origen", "Créditos", "Puntaje")


def row(
    activity: str,
    note: str = "",
    origin: str = "",
    credits: str = "8.00",
    score: str = "",
    tipo: str = "Materia",
) -> TableRow:
    return TableRow((activity, tipo, "", "", note, origin, credits, score))


def plan(*blocks: TableRow | TextLine) -> RawPlan:
    return RawPlan(tuple(blocks))


def test_separa_nombre_y_codigo_y_lee_creditos_origen_y_tipo() -> None:
    raw = plan(
        TextLine("MÓDULO: / Plan basico / Ciclo Introductorio : Depto. de  Ciencia y Tec (X-W-P) "),
        TableRow(HEADER),
        row("Lectura y Escritura Académica (80000)", "9 (Promocionado)", "Promoción", "10.00"),
    )
    (materia,) = parse_plan(raw).subjects
    assert materia.name == "Lectura y Escritura Académica"
    assert materia.code == "80000"
    assert materia.credits == Decimal("10.00")
    assert materia.origin == "Promoción"
    assert materia.activity_type == "Materia"
    assert materia.group == "Ciclo Introductorio : Depto. de Ciencia y Tec (X-W-P)"
    assert materia.is_elective is False
    assert materia.year is None


def test_codigo_alfanumerico() -> None:
    raw = plan(TextLine("MÓDULO: / A"), TableRow(HEADER), row("Matemática (8003N)"))
    assert parse_plan(raw).subjects[0].code == "8003N"


def test_nota_con_promocionado_es_aprobada_con_nota_y_condicion() -> None:
    raw = plan(TextLine("MÓDULO: / A"), TableRow(HEADER), row("X (1)", "9 (Promocionado)"))
    estado = parse_plan(raw).subjects[0].status
    assert estado == EstadoExtraido("approved", grade=Decimal("9"), condition="Promocionado")


def test_materia_sin_nota_queda_sin_estado() -> None:
    raw = plan(TextLine("MÓDULO: / A"), TableRow(HEADER), row("X (1)"))
    assert parse_plan(raw).subjects[0].status is None


def test_bloque_materia_generica_marca_optativas() -> None:
    raw = plan(
        TextLine("MÓDULO: / Obligatorias"),
        TableRow(HEADER),
        row("A (1)"),
        TextLine("MATERIA GENÉRICA: / Núcleo de Orientación - W"),
        TableRow(HEADER),
        row("B (2)", score="8.00"),
    )
    a, b = parse_plan(raw).subjects
    assert (a.is_elective, a.group) == (False, "Obligatorias")
    assert (b.is_elective, b.group) == (True, "Núcleo de Orientación - W")


def test_el_modulo_se_arrastra_al_ignorar_pies_y_encabezados_de_pagina() -> None:
    raw = plan(
        TextLine("MÓDULO: / Cursos Básicos"),
        TextLine("1 de 5 20/11/2026 21:10:24"),
        TextLine("Universidad Nacional de Quilmes"),
        TextLine("Plan de estudios"),
        TableRow(HEADER),
        row("Análisis Matemático I (00054)"),
    )
    assert parse_plan(raw).subjects[0].group == "Cursos Básicos"


def test_se_devuelven_todos_los_modulos_incluso_de_otra_propuesta() -> None:
    raw = plan(
        TextLine("MÓDULO: / Plan basico / Cursos Básicos"),
        TableRow(HEADER),
        row("A (1)"),
        TextLine("MÓDULO: / Plan basico / (NBW) NucleoBasico en Diplomatura en Prog. Informatica"),
        TableRow(HEADER),
        row("B (2)"),
    )
    groups = [s.group for s in parse_plan(raw).subjects]
    assert groups == [
        "Cursos Básicos",
        "(NBW) NucleoBasico en Diplomatura en Prog. Informatica",
    ]


def test_el_segmento_raiz_plan_basico_es_opcional_en_el_titulo() -> None:
    with_root = plan(TextLine("MÓDULO: / Plan basico / Cursos"), TableRow(HEADER), row("A (1)"))
    without_root = plan(TextLine("MÓDULO: / Cursos"), TableRow(HEADER), row("A (1)"))
    assert parse_plan(with_root).subjects == parse_plan(without_root).subjects


def test_encabezado_repetido_leyendas_y_filas_vacias_se_ignoran() -> None:
    raw = plan(
        TextLine("MÓDULO: / A"),
        TableRow(HEADER),
        row("A (1)"),
        TableRow(("", "", "", "", "", "", "", "")),
        TableRow(HEADER),
        row("B (2)"),
        TableRow(("(*): Es una optativa compartida entre genéricas", "", "", "", "", "", "", "")),
        TextLine("(-): Es una optativa compartida entre genéricas"),
    )
    assert [s.code for s in parse_plan(raw).subjects] == ["1", "2"]


def test_columnas_por_nombre_no_por_posicion() -> None:
    header = ("Créditos", "Actividad", "Nota")
    raw = plan(
        TextLine("MÓDULO: / A"),
        TableRow(header),
        TableRow(("12.00", "Álgebra (9)", "7 (Aprobado)")),
    )
    (materia,) = parse_plan(raw).subjects
    assert (materia.code, materia.credits) == ("9", Decimal("12.00"))
    assert materia.status == EstadoExtraido("approved", grade=Decimal("7"), condition="Aprobado")


def test_nombre_sin_codigo() -> None:
    raw = plan(TextLine("MÓDULO: / A"), TableRow(HEADER), row("Taller sin codigo"))
    materia = parse_plan(raw).subjects[0]
    assert (materia.name, materia.code) == ("Taller sin codigo", None)


def test_marcas_de_optativas_compartidas_no_forman_parte_del_nombre() -> None:
    raw = plan(TextLine("MÓDULO: / A"), TableRow(HEADER), row("Ciencia de Datos (01745) (*)"))
    materia = parse_plan(raw).subjects[0]
    assert (materia.name, materia.code) == ("Ciencia de Datos", "01745")


def test_creditos_ilegibles_quedan_sin_dato() -> None:
    raw = plan(TextLine("MÓDULO: / A"), TableRow(HEADER), row("A (1)", credits="n/d"))
    assert parse_plan(raw).subjects[0].credits is None


def test_materia_repetida_conserva_la_primera() -> None:
    raw = plan(
        TextLine("MÓDULO: / Primero"),
        TableRow(HEADER),
        row("A (1)"),
        TextLine("MÓDULO: / Segundo"),
        TableRow(HEADER),
        row("A (1)"),
    )
    (materia,) = parse_plan(raw).subjects
    assert materia.group == "Primero"


def test_plan_info_del_formato_pdf() -> None:
    raw = plan(
        TextLine("Alumno: Ficticia Pérez, Ana Legajo: 99999"),
        TextLine("Propuesta: (W) Licenciatura en Informática Plan: (2019)"),
        TextLine("Versión: 2019-7"),
        TextLine("MÓDULO: / A"),
        TableRow(HEADER),
        row("A (1)"),
    )
    assert parse_plan(raw).plan_info == PlanInfo("Licenciatura en Informática", "2019", "7")


def test_plan_info_del_formato_xls() -> None:
    raw = plan(
        TableRow(("Alumno: Ana Ficticia Pérez", "", "")),
        TableRow(("Legajo: 99999", "", "")),
        TableRow(("Propuesta: (W) Licenciatura en Informática", "", "")),
        TableRow(("Plan: (2019) 2019", "", "")),
        TableRow(("Versión: 7", "", "")),
        TableRow(("MÓDULO: / A", "", "")),
        TableRow(HEADER),
        row("A (1)"),
    )
    assert parse_plan(raw).plan_info == PlanInfo("Licenciatura en Informática", "2019", "7")


def test_los_datos_del_alumno_nunca_llegan_al_resultado() -> None:
    raw = plan(
        TextLine("Alumno: Ficticia Pérez, Ana Legajo: 99999"),
        TextLine("MÓDULO: / A"),
        TableRow(HEADER),
        row("A (1)"),
    )
    resultado = parse_plan(raw)
    assert "Ficticia" not in repr(resultado) and "99999" not in repr(resultado)


def test_sin_tablas_reconocibles_no_hay_materias() -> None:
    import pytest

    from app.domain.errors import NoSubjectsFoundError

    with pytest.raises(NoSubjectsFoundError):
        parse_plan(plan(TextLine("Hola"), TextLine("MÓDULO: / A")))
