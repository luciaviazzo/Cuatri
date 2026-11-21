from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app

FIXTURES = Path(__file__).parents[1] / "fixtures"


@pytest.fixture
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


def extract(client: TestClient, name: str) -> dict[str, Any]:
    content = (FIXTURES / name).read_bytes()
    response = client.post("/planes/extraccion", files={"file": (name, content)})
    assert response.status_code == 200
    body: dict[str, Any] = response.json()
    return {s["code"]: s for s in body["subjects"]}


@pytest.mark.parametrize("name", ["plan_con_correlativas.pdf", "plan_con_correlativas.xls"])
def test_el_json_distingue_null_lista_vacia_y_lista_con_items(
    client: TestClient, name: str
) -> None:
    subjects = extract(client, name)
    assert subjects["01310"]["prerequisites"] is None
    assert subjects["01309"]["prerequisites"] == []
    assert subjects["01051"]["prerequisites"] == [
        {"kind": "subject", "text": "Programación con Objetos II (01037)"},
        {"kind": "unparsed", "text": "CBC aprobado"},
    ]


@pytest.mark.parametrize("name", ["plan_sintetico.pdf", "plan_sintetico.xls"])
def test_el_json_distingue_los_estados(client: TestClient, name: str) -> None:
    subjects = extract(client, name)
    assert subjects["80000"]["status"] == {
        "kind": "approved",
        "grade": "9",
        "condition": "Promocionado",
        "text": None,
    }
    assert subjects["01309"]["status"] == {
        "kind": "unparsed",
        "grade": None,
        "condition": None,
        "text": "2 (Desaprobado)",
    }
    assert subjects["8003N"]["status"] is None
    assert all(s["year"] is None and s["prerequisites"] is None for s in subjects.values())


@pytest.mark.parametrize("name", ["plan_sintetico.pdf", "plan_sintetico.xls"])
def test_las_optativas_y_los_modulos_de_otras_propuestas_se_devuelven_etiquetados(
    client: TestClient, name: str
) -> None:
    subjects = extract(client, name)
    assert subjects["00940"]["is_elective"] is True
    assert subjects["00940"]["group"].startswith("Nucleo de Orientación")
    assert subjects["01033"]["is_elective"] is False
    assert subjects["01033"]["group"] == "(NBW) NucleoBasico en Diplomatura en Prog. Informatica"
