import logging
from io import BytesIO
from typing import Any

import pdfplumber

from app.domain.errors import InvalidFileError
from app.domain.raw_plan import RawBlock, RawPlan, TableRow, TextLine

# pdfminer registra el contenido del documento en nivel DEBUG, incluidos datos personales del
# alumno (FR-014). Se fija un nivel que nunca los emite, aunque el resto de la app use DEBUG.
logging.getLogger("pdfminer").setLevel(logging.WARNING)

_Box = tuple[float, float, float, float]


class PdfPlanReader:
    """Lee un PDF con `pdfplumber` y emite filas de tabla y líneas de texto en orden de lectura.

    No interpreta nada: qué es un módulo, una leyenda o una materia lo decide el dominio.
    """

    def read(self, content: bytes) -> RawPlan:
        try:
            return self._read(content)
        except Exception as exc:  # pdfplumber/pdfminer lanzan tipos muy variados
            raise InvalidFileError() from exc

    def _read(self, content: bytes) -> RawPlan:
        blocks: list[RawBlock] = []
        with pdfplumber.open(BytesIO(content)) as pdf:
            for page in pdf.pages:
                positioned: list[tuple[float, RawBlock]] = []
                tables = page.find_tables()
                boxes: list[_Box] = [table.bbox for table in tables]
                for table in tables:
                    for index, cells in enumerate(table.extract()):
                        row = TableRow(tuple((cell or "") for cell in cells))
                        # La fila `index` va después de la anterior dentro de la tabla.
                        positioned.append((table.bbox[1] + index * 1e-3, row))
                outside = page.filter(_outside_of(boxes))
                for line in outside.extract_text_lines():
                    if line["text"].strip():
                        positioned.append((line["top"], TextLine(line["text"])))
                positioned.sort(key=lambda item: item[0])
                blocks.extend(block for _, block in positioned)
        return RawPlan(tuple(blocks))


def _outside_of(boxes: list[_Box]) -> Any:
    def keep(obj: dict[str, Any]) -> bool:
        if "x0" not in obj or "top" not in obj:
            return True
        return not any(
            obj["x0"] >= bx0 - 1
            and obj["x1"] <= bx1 + 1
            and obj["top"] >= btop - 1
            and obj["bottom"] <= bbottom + 1
            for bx0, btop, bx1, bbottom in boxes
        )

    return keep
