from typing import Any

from fastapi.testclient import TestClient

from app.main import app


def test_openapi_documenta_el_endpoint_con_su_respuesta_y_sus_errores() -> None:
    spec: dict[str, Any] = TestClient(app).get("/openapi.json").json()
    operation = spec["paths"]["/planes/extraccion"]["post"]
    responses = operation["responses"]
    assert set(responses) >= {"200", "400", "413", "422"}
    ok_schema = responses["200"]["content"]["application/json"]["schema"]["$ref"]
    assert ok_schema.endswith("/ExtraccionResponse")
    for status in ("400", "413", "422"):
        assert responses[status]["content"]["application/json"]["schema"]["$ref"].endswith(
            "/ErrorResponse"
        )
    assert "multipart/form-data" in operation["requestBody"]["content"]


def test_openapi_describe_los_campos_de_datos_faltantes() -> None:
    spec: dict[str, Any] = TestClient(app).get("/openapi.json").json()
    props = spec["components"]["schemas"]["MateriaSchema"]["properties"]
    assert "sin determinar" in props["prerequisites"]["description"]
    assert "sin asignar" in props["year"]["description"]
