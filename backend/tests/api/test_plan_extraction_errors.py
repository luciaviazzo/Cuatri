from collections.abc import Iterator
from io import BytesIO
from pathlib import Path
from typing import Any

import pytest
import xlwt
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas

from app.core.config import get_settings
from app.main import app

FIXTURES = Path(__file__).parents[1] / "fixtures"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


@pytest.fixture
def client() -> Iterator[TestClient]:
    get_settings.cache_clear()
    yield TestClient(app, raise_server_exceptions=False)
    get_settings.cache_clear()


def post(client: TestClient, name: str, content: bytes) -> Any:
    return client.post("/planes/extraccion", files={"file": (name, content)})


def assert_error(response: Any, status: int, code: str) -> None:
    assert response.status_code == status
    body = response.json()
    assert list(body) == ["error"]
    assert body["error"]["code"] == code
    assert body["error"]["message"]
    assert "Traceback" not in response.text and 'File "' not in response.text


def test_archivo_vacio(client: TestClient) -> None:
    assert_error(post(client, "plan.pdf", b""), 400, "empty_file")


def test_archivo_demasiado_grande(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("MAX_UPLOAD_BYTES", "100")
    get_settings.cache_clear()
    content = (FIXTURES / "plan_sintetico.pdf").read_bytes()
    assert_error(post(client, "plan.pdf", content), 413, "file_too_large")


@pytest.mark.parametrize("name", ["plan.pdf", "plan.xls", "plan.png", "plan"])
def test_imagen_con_cualquier_extension_es_un_archivo_invalido(
    client: TestClient, name: str
) -> None:
    assert_error(post(client, name, PNG), 422, "invalid_file")


def test_documento_de_otro_formato(client: TestClient) -> None:
    assert_error(post(client, "plan.pdf", b"PK\x03\x04 un zip"), 422, "invalid_file")


def test_pdf_corrupto(client: TestClient) -> None:
    assert_error(post(client, "plan.pdf", b"%PDF-1.3 roto"), 422, "invalid_file")


def test_xls_corrupto(client: TestClient) -> None:
    content = (FIXTURES / "plan_sintetico.xls").read_bytes()[:700]
    assert_error(post(client, "plan.xls", content), 422, "invalid_file")


def test_pdf_valido_sin_materias(client: TestClient) -> None:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer)
    pdf.drawString(72, 700, "Un documento cualquiera")
    pdf.save()
    assert_error(post(client, "plan.pdf", buffer.getvalue()), 422, "no_subjects_found")


def test_excel_valido_sin_materias(client: TestClient) -> None:
    workbook = xlwt.Workbook()
    workbook.add_sheet("Hoja1").write(0, 0, "Solo un texto")
    buffer = BytesIO()
    workbook.save(buffer)
    assert_error(post(client, "plan.xls", buffer.getvalue()), 422, "no_subjects_found")


def test_falta_el_campo_file(client: TestClient) -> None:
    response = client.post("/planes/extraccion")
    assert_error(response, 422, "validation_error")


def test_health_no_se_ve_afectado_por_el_modulo_de_extraccion(client: TestClient) -> None:
    assert client.get("/docs").status_code == 200
