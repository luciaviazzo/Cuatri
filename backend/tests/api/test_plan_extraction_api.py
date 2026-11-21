import logging
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.fixtures.make_plan_fixtures import EXPECTED_SUBJECT_COUNT

FIXTURES = Path(__file__).parents[1] / "fixtures"
CASES = [
    ("plan_sintetico.pdf", "application/pdf"),
    ("plan_sintetico.xls", "application/vnd.ms-excel"),
]


@pytest.fixture
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


def upload(client: TestClient, name: str, content_type: str) -> Any:
    content = (FIXTURES / name).read_bytes()
    return client.post("/planes/extraccion", files={"file": (name, content, content_type)})


@pytest.mark.parametrize(("name", "content_type"), CASES)
def test_extrae_las_materias_de_pdf_y_xls(client: TestClient, name: str, content_type: str) -> None:
    response = upload(client, name, content_type)
    assert response.status_code == 200
    body = response.json()
    assert body["plan_info"] == {
        "program": "Licenciatura en Informática",
        "plan": "2019",
        "version": "7",
    }
    assert len(body["subjects"]) == EXPECTED_SUBJECT_COUNT
    first = body["subjects"][0]
    assert first == {
        "code": "80000",
        "name": "Lectura y Escritura Académica",
        "activity_type": "Materia",
        "credits": "10.00",
        "group": "Ciclo Introductorio : Depto. de Ciencia y Tec (X-W-P)",
        "is_elective": False,
        "year": None,
        "reported_year": None,
        "reported_term": None,
        "origin": "Promoción",
        "prerequisites": None,
        "status": {"kind": "approved", "grade": "9", "condition": "Promocionado", "text": None},
    }


@pytest.mark.parametrize(("name", "content_type"), CASES)
def test_no_devuelve_ni_registra_datos_del_alumno(
    client: TestClient, caplog: pytest.LogCaptureFixture, name: str, content_type: str
) -> None:
    with caplog.at_level(logging.DEBUG):
        response = upload(client, name, content_type)
    assert response.status_code == 200
    for secret in ("Ficticia", "99999", "Alumno", "Legajo"):
        assert secret not in response.text
        assert secret not in caplog.text


def test_la_documentacion_openapi_incluye_el_endpoint(client: TestClient) -> None:
    assert "/planes/extraccion" in client.get("/openapi.json").json()["paths"]
