"""Estructura intermedia que producen los lectores de archivos y consume el parser del dominio.

Los lectores no interpretan nada: solo distinguen filas de tabla de líneas de texto. Qué es un
título de módulo, una leyenda o una materia lo decide el parser del dominio.
"""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TableRow:
    """Una fila de tabla, con una celda de texto por columna (las vacías incluidas)."""

    cells: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class TextLine:
    """Una línea de texto fuera de una tabla (títulos, encabezado del plan, leyendas, pies)."""

    text: str


RawBlock = TableRow | TextLine


@dataclass(frozen=True, slots=True)
class RawPlan:
    """Bloques del archivo en orden de lectura."""

    blocks: tuple[RawBlock, ...]
