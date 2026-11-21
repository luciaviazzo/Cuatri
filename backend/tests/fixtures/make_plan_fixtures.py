"""Genera planes sintéticos (PDF y XLS) que imitan el reporte "Plan de estudios" de SIU.

No contienen datos personales reales (el alumno es ficticio). Se regeneran con:

    uv run python -m tests.fixtures.make_plan_fixtures
"""

from dataclasses import dataclass
from pathlib import Path

import xlwt
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

FIXTURES_DIR = Path(__file__).parent
STUDENT = "Ficticia Pérez, Ana"
STUDENT_ID = "99999"

BASE_HEADER = ["Actividad", "Tipo", "Año", "Período", "Nota", "Origen", "Créditos", "Puntaje"]
LEGENDS = [
    "(*): Es una optativa compartida entre genéricas y el alumno la seleccionó para esa genérica.",
    "(-): Es una optativa compartida entre genéricas y el alumno la seleccionó para otra genérica.",
    "(!): Es una optativa compartida entre genéricas y el alumno aún no seleccionó "
    "para qué genérica se cumple.",
]


@dataclass(frozen=True)
class Row:
    activity: str
    note: str = ""
    origin: str = ""
    credits: str = "8.00"
    score: str = ""
    prerequisites: str = ""


@dataclass(frozen=True)
class Group:
    heading: str
    rows: tuple[Row, ...]
    page_break_before_table: bool = False


GROUPS = (
    Group(
        "MÓDULO: / Plan basico / Ciclo Introductorio : Depto. de Ciencia y Tec (X-W-P)",
        (
            Row("Lectura y Escritura Académica (80000)", "9 (Promocionado)", "Promoción", "10.00"),
            Row(
                "Elementos de Programación y Lógica (80005)",
                "10 (Promocionado)",
                "Promoción",
                "10.00",
            ),
            Row("Matemática (8003N)", credits="10.00"),
        ),
    ),
    Group(
        "MÓDULO: / Plan basico / Cursos Avanzados de la carr:Lic en Informática(2012-2015-19)",
        (
            Row(
                "Programación con Objetos III (01051)",
                "8 (Promocionado)",
                "Promoción",
                prerequisites="Programación con Objetos II (01037); CBC aprobado",
            ),
            Row("Teoría de la Computación (01309)", "2 (Desaprobado)", prerequisites="Ninguna"),
            Row("Arquitectura de Software I (01310)", credits="12.00"),
        ),
    ),
    Group(
        "MÓDULO: / Plan basico / Cursos Básicos de la carrera: Lic en Informatica (2015-19)",
        (
            Row("Análisis Matemático I (00054)", credits="12.00"),
            Row("Probabilidad y Estadística (00604)", credits="12.00"),
            Row("Programación Concurrente (01040)", "9 (Promocionado)", "Promoción"),
        ),
        page_break_before_table=True,
    ),
    Group(
        "MATERIA GENÉRICA: / Plan basico / Nucleo de Orientación - carrera: Lic en Informática "
        "(2019) / Núcleo de Orientación del Ciclo Superior - W",
        (
            Row("Redes Neuronales (00940)", score="8.00"),
            Row("Bases de Datos II (01048)", score="8.00"),
            Row("Seminarios (01622)", score="8.00"),
        ),
    ),
    Group(
        "MÓDULO: / Plan basico / (NBW) NucleoBasico en Diplomatura en Prog. Informatica",
        (
            Row("Matemática I (01033)", "9 (Promocionado)", "Promoción", "16.00"),
            Row("Introducción a la Programación (00487)", "9 (Promocionado)", "Promoción", "16.00"),
        ),
    ),
)

EXPECTED_SUBJECT_COUNT = sum(len(g.rows) for g in GROUPS)


def _header(with_prerequisites: bool) -> list[str]:
    return [*BASE_HEADER, "Correlativas"] if with_prerequisites else list(BASE_HEADER)


def _cells(row: Row, *, with_prerequisites: bool, with_period: bool, group: Group) -> list[str]:
    year = "2023" if with_period and row.note else ""
    term = "2° Cuatrimestre" if with_period and row.note else ""
    cells = [row.activity, "Materia", year, term, row.note, row.origin, row.credits, row.score]
    if with_prerequisites:
        cells.append(row.prerequisites)
    return cells


def build_pdf(path: Path, *, with_prerequisites: bool = False, with_period: bool = False) -> None:
    styles = getSampleStyleSheet()
    heading_style = styles["Normal"]
    legend_style = styles["Normal"]

    def page_frame(canvas, doc) -> None:  # type: ignore[no-untyped-def]
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        top = landscape(A4)[1] - 24
        for i, line in enumerate(
            [
                "Universidad Nacional de Quilmes",
                "Plan de estudios",
                f"Alumno: {STUDENT} Legajo: {STUDENT_ID}",
                "Propuesta: (W) Licenciatura en Informática Plan: (2019)",
                "Versión: 2019-7",
            ]
        ):
            canvas.drawString(24, top - i * 11, line)
        canvas.drawString(24, 16, f"{doc.page} de ? 20/11/2026 00:00:00")
        canvas.restoreState()

    widths = [220, 40, 30, 60, 80, 55, 40, 35]
    if with_prerequisites:
        widths.append(230)
    style = TableStyle(
        [
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    )

    doc = SimpleDocTemplate(
        str(path),
        pagesize=landscape(A4),
        leftMargin=24,
        rightMargin=24,
        topMargin=90,
        bottomMargin=30,
    )
    story: list[object] = []
    for group in GROUPS:
        story.append(Paragraph(group.heading, heading_style))
        story.append(Spacer(1, 6))
        if group.page_break_before_table:
            story.append(PageBreak())
        data = [_header(with_prerequisites)] + [
            _cells(r, with_prerequisites=with_prerequisites, with_period=with_period, group=group)
            for r in group.rows
        ]
        story.append(Table(data, colWidths=widths, style=style, repeatRows=1))
        story.append(Spacer(1, 12))
    for legend in LEGENDS:
        story.append(Paragraph(legend, legend_style))
    doc.build(story, onFirstPage=page_frame, onLaterPages=page_frame)


def build_xls(path: Path, *, with_prerequisites: bool = False, with_period: bool = False) -> None:
    workbook = xlwt.Workbook(encoding="utf-8")
    sheet = workbook.add_sheet("Reporte")
    r = 0
    for line in [
        "Universidad Nacional de Quilmes",
        "",
        "Plan de estudios",
        "",
        "Alumno: Ana Ficticia Pérez",
        f"Legajo: {STUDENT_ID}",
        "Propuesta: (W) Licenciatura en Informática",
        "Plan: (2019) 2019",
        "Versión: 7",
        "",
        "",
    ]:
        sheet.write(r, 0, line)
        r += 1
    for group in GROUPS:
        sheet.write(r, 0, group.heading + " ")
        r += 2
        for c, value in enumerate(_header(with_prerequisites)):
            sheet.write(r, c, value)
        r += 1
        for row in group.rows:
            cells = _cells(
                row, with_prerequisites=with_prerequisites, with_period=with_period, group=group
            )
            for c, value in enumerate(cells):
                sheet.write(r, c, value)
            r += 1
        r += 2
    for legend in LEGENDS:
        sheet.write(r, 0, legend)
        r += 1
    workbook.save(str(path))


def main() -> None:
    build_pdf(FIXTURES_DIR / "plan_sintetico.pdf")
    build_xls(FIXTURES_DIR / "plan_sintetico.xls")
    # Variante con columna de correlativas y con Año/Período informados.
    build_pdf(FIXTURES_DIR / "plan_con_correlativas.pdf", with_prerequisites=True, with_period=True)
    build_xls(FIXTURES_DIR / "plan_con_correlativas.xls", with_prerequisites=True, with_period=True)


if __name__ == "__main__":
    main()
