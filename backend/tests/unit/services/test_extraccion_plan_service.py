from app.domain.file_format import FileFormat
from app.domain.raw_plan import RawPlan, TableRow, TextLine
from app.services.extraccion_plan_service import ExtraccionPlanService

HEADER = TableRow(("Actividad", "Tipo", "Año", "Período", "Nota", "Origen", "Créditos", "Puntaje"))
PDF_BYTES = b"%PDF-1.3 contenido"
XLS_BYTES = bytes.fromhex("D0CF11E0A1B11AE1") + b"contenido"


class FakeReader:
    def __init__(self, activity: str) -> None:
        self.activity = activity
        self.calls: list[bytes] = []

    def read(self, content: bytes) -> RawPlan:
        self.calls.append(content)
        return RawPlan(
            (
                TextLine("MÓDULO: / A"),
                HEADER,
                TableRow((self.activity, "Materia", "", "", "", "", "8.00", "")),
            )
        )


def make_service() -> tuple[ExtraccionPlanService, FakeReader, FakeReader]:
    pdf, xls = FakeReader("Desde PDF (1)"), FakeReader("Desde XLS (2)")
    service = ExtraccionPlanService(
        readers={FileFormat.PDF: pdf, FileFormat.XLS: xls}, max_upload_bytes=1024
    )
    return service, pdf, xls


def test_usa_el_lector_de_pdf_para_un_pdf() -> None:
    service, pdf, xls = make_service()
    result = service.extract(PDF_BYTES)
    assert result.subjects[0].name == "Desde PDF"
    assert pdf.calls == [PDF_BYTES] and xls.calls == []


def test_usa_el_lector_de_xls_para_un_documento_de_office() -> None:
    service, pdf, xls = make_service()
    result = service.extract(XLS_BYTES)
    assert result.subjects[0].name == "Desde XLS"
    assert xls.calls == [XLS_BYTES] and pdf.calls == []
