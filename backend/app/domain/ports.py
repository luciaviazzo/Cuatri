from typing import Protocol

from app.domain.raw_plan import RawPlan


class PlanFileReader(Protocol):
    """Lee un archivo de plan de estudios y lo convierte en una estructura intermedia.

    Debe lanzar `InvalidFileError` si el contenido no se puede abrir.
    """

    def read(self, content: bytes) -> RawPlan: ...
