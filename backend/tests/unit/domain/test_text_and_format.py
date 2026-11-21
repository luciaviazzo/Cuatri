from hypothesis import given
from hypothesis import strategies as st

from app.domain.file_format import FileFormat, detect_file_format
from app.domain.text_cleaning import clean_text, normalize_key


def test_detecta_pdf_por_contenido() -> None:
    assert detect_file_format(b"%PDF-1.3\n...") is FileFormat.PDF


def test_detecta_documento_de_office_como_xls() -> None:
    assert detect_file_format(bytes.fromhex("D0CF11E0A1B11AE1") + b"\x00" * 10) is FileFormat.XLS


def test_imagen_con_cualquier_extension_no_es_soportada() -> None:
    png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 20
    assert detect_file_format(png) is None


def test_bytes_vacios_o_texto_no_son_soportados() -> None:
    assert detect_file_format(b"") is None
    assert detect_file_format(b"hola, esto no es un plan") is None


def test_limpieza_quita_espacios_y_une_lineas_partidas() -> None:
    assert clean_text("  Programación\n  con   Objetos \r\n III ") == "Programación con Objetos III"


def test_limpieza_no_cambia_mayusculas_ni_tildes() -> None:
    assert clean_text("  INTRODUCCIÓN  a la Programación ") == "INTRODUCCIÓN a la Programación"


@given(st.text())
def test_limpieza_es_idempotente(value: str) -> None:
    once = clean_text(value)
    assert clean_text(once) == once


@given(st.text())
def test_limpieza_no_deja_espacios_dobles_ni_en_los_bordes(value: str) -> None:
    cleaned = clean_text(value)
    assert cleaned == cleaned.strip()
    assert "  " not in cleaned


@given(st.text(alphabet=st.characters(categories=["Lu", "Ll"]), min_size=1))
def test_limpieza_conserva_letras_y_su_caso(value: str) -> None:
    assert clean_text(value) == value


def test_clave_normalizada_ignora_tildes_y_mayusculas() -> None:
    assert normalize_key("  Álgebra   LINEAL ") == normalize_key("algebra lineal")


@given(st.text())
def test_clave_normalizada_es_idempotente(value: str) -> None:
    once = normalize_key(value)
    assert normalize_key(once) == once
