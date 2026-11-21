from hypothesis import given
from hypothesis import strategies as st

from app.domain.errors import NoSubjectsFoundError
from app.domain.plan_parser import parse_plan
from app.domain.raw_plan import RawPlan, TableRow, TextLine
from app.domain.text_cleaning import clean_text

HEADER = TableRow(("Actividad", "Tipo", "Año", "Período", "Nota", "Origen", "Créditos", "Puntaje"))

cell = st.text(max_size=30)
data_row = st.tuples(cell, cell, cell, cell, cell, cell, cell, cell).map(TableRow)
group_heading = st.text(max_size=20).map(lambda t: TextLine(f"MÓDULO: / {t}"))
blocks = st.lists(st.one_of(data_row, group_heading, st.just(HEADER)), max_size=25)


def _parse(items: list[TableRow | TextLine]) -> tuple[RawPlan, list[object]]:
    raw = RawPlan((HEADER, *items))
    try:
        return raw, list(parse_plan(raw).subjects)
    except NoSubjectsFoundError:
        return raw, []


@given(blocks)
def test_el_parser_nunca_inventa_materias(items: list[TableRow | TextLine]) -> None:
    raw, subjects = _parse(items)
    activities = [
        clean_text(b.cells[0]) for b in raw.blocks if isinstance(b, TableRow) and b.cells[0]
    ]
    for subject in subjects:
        name = subject.name  # type: ignore[attr-defined]
        assert any(name in activity for activity in activities)


@given(blocks)
def test_nunca_hay_aprobadas_sin_nota_valida_ni_duplicados(
    items: list[TableRow | TextLine],
) -> None:
    from app.domain.plan_extraction import MateriaExtraida, subject_identity

    _, subjects = _parse(items)
    typed = [s for s in subjects if isinstance(s, MateriaExtraida)]
    identities = [subject_identity(s) for s in typed]
    assert len(identities) == len(set(identities))
    for subject in typed:
        if subject.status is not None and subject.status.kind == "approved":
            assert subject.status.grade is not None
            assert 0 <= subject.status.grade <= 10
        assert subject.year is None
        assert subject.prerequisites is None
