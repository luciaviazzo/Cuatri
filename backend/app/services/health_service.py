from typing import Protocol

from app.domain.errors import DatabaseUnavailableError


class Pingable(Protocol):
    def ping(self) -> bool: ...


class HealthService:
    def __init__(self, repository: Pingable) -> None:
        self._repository = repository

    def check(self) -> None:
        if not self._repository.ping():
            raise DatabaseUnavailableError("No se pudo conectar a la base de datos")
