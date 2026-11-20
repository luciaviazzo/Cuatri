from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.core.wiring import get_health_service
from app.main import app
from app.services.health_service import HealthService


class FakeRepo:
    def __init__(self, ok: bool) -> None:
        self._ok = ok

    def ping(self) -> bool:
        return self._ok


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


def test_health_ok(client: TestClient) -> None:
    app.dependency_overrides[get_health_service] = lambda: HealthService(FakeRepo(True))
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "up"}


def test_health_db_caida_devuelve_503(client: TestClient) -> None:
    app.dependency_overrides[get_health_service] = lambda: HealthService(FakeRepo(False))
    response = client.get("/health")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "database_unavailable"


def test_error_inesperado_no_expone_stack_trace(client: TestClient) -> None:
    def boom() -> HealthService:
        raise RuntimeError("secreto interno")

    app.dependency_overrides[get_health_service] = boom
    response = client.get("/health")
    assert response.status_code == 500
    assert response.json() == {
        "error": {"code": "internal_error", "message": "Error interno del servidor"}
    }
    assert "secreto" not in response.text


def test_ruta_inexistente_usa_formato_de_error(client: TestClient) -> None:
    response = client.get("/nope")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "http_error"


def test_docs_disponible(client: TestClient) -> None:
    assert client.get("/docs").status_code == 200
