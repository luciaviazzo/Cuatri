from io import BytesIO

from python_calamine import CalamineWorkbook, SheetTypeEnum, SheetVisibleEnum

from app.domain.errors import InvalidFileError
from app.domain.raw_plan import RawBlock, RawPlan, TableRow


class XlsPlanReader:
    """Lee un Excel (.xls) con `python-calamine`: solo valores de celdas, de todas las hojas.

    No ejecuta fórmulas, macros ni contenido activo. No interpreta nada: emite cada fila no vacía
    como una fila de tabla y deja que el dominio decida qué es cada una. Las hojas ocultas no
    forman parte del plan.
    """

    def read(self, content: bytes) -> RawPlan:
        try:
            return self._read(content)
        except Exception as exc:  # calamine lanza errores genéricos ante archivos inválidos
            raise InvalidFileError() from exc

    def _read(self, content: bytes) -> RawPlan:
        workbook = CalamineWorkbook.from_filelike(BytesIO(content))
        blocks: list[RawBlock] = []
        for sheet in workbook.sheets_metadata:
            if sheet.typ != SheetTypeEnum.WorkSheet or sheet.visible != SheetVisibleEnum.Visible:
                continue
            for row in workbook.get_sheet_by_name(sheet.name).to_python():
                cells = tuple("" if value is None else str(value) for value in row)
                if any(cell.strip() for cell in cells):
                    blocks.append(TableRow(cells))
        return RawPlan(tuple(blocks))
