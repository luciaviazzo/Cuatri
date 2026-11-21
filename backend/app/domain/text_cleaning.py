import re
import unicodedata

_WHITESPACE = re.compile(r"\s+")


def clean_text(value: str) -> str:
    """Quita espacios sobrantes y saltos de línea partidos.

    No cambia mayúsculas ni tildes (FR-003).
    """
    return _WHITESPACE.sub(" ", value).strip()


def normalize_key(value: str) -> str:
    """Clave de comparación sin tildes y en minúsculas; solo para identificar, no para mostrar."""
    decomposed = unicodedata.normalize("NFD", clean_text(value))
    without_marks = "".join(c for c in decomposed if not unicodedata.combining(c))
    return without_marks.casefold()
