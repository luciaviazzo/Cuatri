from decimal import Decimal

import pytest

from app.domain.errors import DomainInvariantError, NoSubjectsFoundError
from app.domain.plan_extraction import (
    EstadoExtraido,
    MateriaExtraida,
    PlanInfo,
    Requisito,
    ResultadoExtraccion,
    subject_identity,
)


def test_materia_minima_es_valida() -> None:
    materia = MateriaExtraida(name="Matemática")
    assert materia.code is None and materia.year is None
    assert materia.prerequisites is None and materia.status is None
    assert materia.is_elective is False


@pytest.mark.parametrize(
    "kwargs",
    [
        {"name": "  "},
        {"name": "X", "code": "80 000"},
        {"name": "X", "code": ""},
        {"name": "X", "credits": Decimal("-1")},
        {"name": "X", "year": 0},
    ],
)
def test_materia_invalida(kwargs: dict[str, object]) -> None:
    with pytest.raises(DomainInvariantError):
        MateriaExtraida(**kwargs)  # type: ignore[arg-type]


def test_tres_estados_de_correlativas_son_distinguibles() -> None:
    sin_determinar = MateriaExtraida(name="A", prerequisites=None)
    sin_correlativas = MateriaExtraida(name="B", prerequisites=())
    con_correlativas = MateriaExtraida(name="C", prerequisites=(Requisito("subject", "A"),))
    assert sin_determinar.prerequisites is None
    assert sin_correlativas.prerequisites == ()
    assert con_correlativas.prerequisites != () and con_correlativas.prerequisites is not None


def test_requisito_vacio_es_invalido() -> None:
    with pytest.raises(DomainInvariantError):
        Requisito("unparsed", " ")


def test_estado_aprobado_requiere_nota_entre_0_y_10() -> None:
    assert EstadoExtraido("approved", grade=Decimal("9"), condition="Promocionado").grade == 9
    for grade in (None, Decimal("-1"), Decimal("11")):
        with pytest.raises(DomainInvariantError):
            EstadoExtraido("approved", grade=grade)


def test_estado_no_interpretado_requiere_texto_y_no_lleva_nota() -> None:
    assert EstadoExtraido("unparsed", text="2 (Desaprobado)").text == "2 (Desaprobado)"
    with pytest.raises(DomainInvariantError):
        EstadoExtraido("unparsed")
    with pytest.raises(DomainInvariantError):
        EstadoExtraido("unparsed", text="x", grade=Decimal("1"))


def test_estado_en_curso() -> None:
    assert EstadoExtraido("in_progress").kind == "in_progress"
    with pytest.raises(DomainInvariantError):
        EstadoExtraido("in_progress", condition="algo")


def test_resultado_vacio_lanza_error_de_dominio() -> None:
    with pytest.raises(NoSubjectsFoundError):
        ResultadoExtraccion.build(PlanInfo(), [])


def test_build_deduplica_por_codigo_y_conserva_la_primera() -> None:
    primera = MateriaExtraida(name="Matemática", code="8003N", group="A")
    repetida = MateriaExtraida(name="Matematica (otra)", code="8003n", group="B")
    otra = MateriaExtraida(name="Álgebra", code="00001")
    resultado = ResultadoExtraccion.build(PlanInfo(), [primera, repetida, otra])
    assert resultado.subjects == (primera, otra)


def test_build_deduplica_por_nombre_normalizado_si_no_hay_codigo() -> None:
    a = MateriaExtraida(name="Programación  Funcional")
    b = MateriaExtraida(name="programacion funcional")
    assert len(ResultadoExtraccion.build(PlanInfo(), [a, b]).subjects) == 1


def test_resultado_directo_con_duplicados_viola_la_invariante() -> None:
    m = MateriaExtraida(name="A", code="1")
    with pytest.raises(DomainInvariantError):
        ResultadoExtraccion(PlanInfo(), (m, m))


def test_identidad_prefiere_el_codigo() -> None:
    assert subject_identity(MateriaExtraida(name="A", code="X1")) == "code:x1"
    assert subject_identity(MateriaExtraida(name="Álgebra")) == "name:algebra"
