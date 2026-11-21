import pytest

from app.domain.errors import (
    EmptyFileError,
    FileTooLargeError,
    InvalidFileError,
    NoSubjectsFoundError,
)
from app.domain.file_format import FileFormat
from app.domain.raw_plan import RawPlan, TextLine
from app.services.extraccion_plan_service import ExtraccionPlanService

PDF_BYTES = b"%PDF-1.3 contenido"


class SinMateriasReader:
    def read(self, content: bytes) -> RawPlan:
        return RawPlan((TextLine("Un documento sin tablas"),))


class RoturaReader:
    def read(self, content: bytes) -> RawPlan:
        raise InvalidFileError()


def make_service(reader: object, max_upload_bytes: int = 1024) -> ExtraccionPlanService:
    return ExtraccionPlanService(
        readers={FileFormat.PDF: reader, FileFormat.XLS: reader},  # type: ignore[dict-item]
        max_upload_bytes=max_upload_bytes,
    )


def test_archivo_vacio() -> None:
    with pytest.raises(EmptyFileError):
        make_service(SinMateriasReader()).extract(b"")


def test_archivo_que_supera_el_maximo() -> None:
    service = make_service(SinMateriasReader(), max_upload_bytes=10)
    with pytest.raises(FileTooLargeError):
        service.extract(PDF_BYTES)


def test_el_tamano_exacto_del_maximo_es_aceptado() -> None:
    service = make_service(SinMateriasReader(), max_upload_bytes=len(PDF_BYTES))
    with pytest.raises(NoSubjectsFoundError):  # pasa la validación de tamaño
        service.extract(PDF_BYTES)


@pytest.mark.parametrize(
    "content",
    [b"\x89PNG\r\n\x1a\n" + b"\x00" * 20, b"texto plano que no es un plan", b"PK\x03\x04 zip"],
)
def test_formato_no_soportado(content: bytes) -> None:
    with pytest.raises(InvalidFileError):
        make_service(SinMateriasReader()).extract(content)


def test_documento_valido_sin_materias_es_un_rechazo_no_un_resultado_vacio() -> None:
    with pytest.raises(NoSubjectsFoundError):
        make_service(SinMateriasReader()).extract(PDF_BYTES)


def test_un_lector_que_no_puede_abrir_el_archivo_propaga_el_error() -> None:
    with pytest.raises(InvalidFileError):
        make_service(RoturaReader()).extract(PDF_BYTES)
