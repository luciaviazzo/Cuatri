from io import BytesIO
from pathlib import Path

import pytest
import xlwt
from reportlab.pdfgen import canvas

from app.adapters.pdf_plan_reader import PdfPlanReader
from app.adapters.xls_plan_reader import XlsPlanReader
from app.domain.errors import InvalidFileError
from app.domain.raw_plan import TableRow, TextLine

FIXTURES = Path(__file__).parents[2] / "fixtures"
OLE2 = bytes.fromhex("D0CF11E0A1B11AE1")


@pytest.mark.parametrize(
    "content",
    [
        b"%PDF-1.3 esto esta roto",
        b"%PDF-",
        (FIXTURES / "plan_sintetico.pdf").read_bytes()[:300],
    ],
)
def test_pdf_corrupto_o_truncado_es_un_archivo_invalido(content: bytes) -> None:
    with pytest.raises(InvalidFileError):
        PdfPlanReader().read(content)


@pytest.mark.parametrize(
    "content",
    [
        OLE2,
        OLE2 + b"\x00" * 600,
        (FIXTURES / "plan_sintetico.xls").read_bytes()[:700],
        b"no es un excel",
    ],
)
def test_xls_corrupto_o_que_no_es_un_libro_es_un_archivo_invalido(content: bytes) -> None:
    with pytest.raises(InvalidFileError):
        XlsPlanReader().read(content)


def test_pdf_valido_sin_tablas_devuelve_solo_lineas_de_texto() -> None:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer)
    pdf.drawString(72, 700, "Un documento cualquiera sin tablas")
    pdf.save()
    raw = PdfPlanReader().read(buffer.getvalue())
    assert raw.blocks and all(isinstance(b, TextLine) for b in raw.blocks)


def test_xls_valido_sin_materias_devuelve_filas_pero_ninguna_tabla_de_plan() -> None:
    workbook = xlwt.Workbook()
    sheet = workbook.add_sheet("Hoja1")
    sheet.write(0, 0, "Solo un texto")
    buffer = BytesIO()
    workbook.save(buffer)
    raw = XlsPlanReader().read(buffer.getvalue())
    assert [b.cells[0] for b in raw.blocks if isinstance(b, TableRow)] == ["Solo un texto"]


def test_xls_con_varias_hojas_reune_las_filas_de_todas() -> None:
    workbook = xlwt.Workbook()
    for name, text in (("Uno", "primera hoja"), ("Dos", "segunda hoja")):
        workbook.add_sheet(name).write(0, 0, text)
    buffer = BytesIO()
    workbook.save(buffer)
    raw = XlsPlanReader().read(buffer.getvalue())
    assert [b.cells[0] for b in raw.blocks if isinstance(b, TableRow)] == [
        "primera hoja",
        "segunda hoja",
    ]
