from collections.abc import Mapping

from app.domain.errors import EmptyFileError, FileTooLargeError, InvalidFileError
from app.domain.file_format import FileFormat, detect_file_format
from app.domain.plan_extraction import ResultadoExtraccion
from app.domain.plan_parser import parse_plan
from app.domain.ports import PlanFileReader


class ExtraccionPlanService:
    """Orquesta la extracción: detecta el formato, lee el archivo y lo interpreta.

    Solo conoce el puerto `PlanFileReader`; los lectores concretos se inyectan desde
    `app/core/wiring.py` (el Service no importa Adapters).
    """

    def __init__(self, readers: Mapping[FileFormat, PlanFileReader], max_upload_bytes: int) -> None:
        self._readers = readers
        self._max_upload_bytes = max_upload_bytes

    def extract(self, content: bytes) -> ResultadoExtraccion:
        if not content:
            raise EmptyFileError()
        if len(content) > self._max_upload_bytes:
            raise FileTooLargeError()
        file_format = detect_file_format(content)
        reader = self._readers.get(file_format) if file_format is not None else None
        if reader is None:
            raise InvalidFileError()
        return parse_plan(reader.read(content))
