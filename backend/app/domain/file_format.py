from enum import Enum


class FileFormat(Enum):
    PDF = "pdf"
    XLS = "xls"


_PDF_SIGNATURE = b"%PDF-"
# Cabecera de los documentos compuestos de Office (.xls, pero también .doc, .ppt, etc.).
_OLE2_SIGNATURE = bytes.fromhex("D0CF11E0A1B11AE1")


def detect_file_format(content: bytes) -> FileFormat | None:
    """Identifica el formato por el contenido, ignorando la extensión (FR-002).

    La firma de Office no distingue un .xls de un .doc: eso lo resuelve el lector.
    """
    if _PDF_SIGNATURE in content[:1024]:
        return FileFormat.PDF
    if content.startswith(_OLE2_SIGNATURE):
        return FileFormat.XLS
    return None
