from pathlib import Path

from app.adapters.pdf_plan_reader import PdfPlanReader
from app.adapters.xls_plan_reader import XlsPlanReader
from app.domain.plan_parser import parse_plan
from tests.fixtures.make_plan_fixtures import EXPECTED_SUBJECT_COUNT

FIXTURES = Path(__file__).parent.parent / "fixtures"


def test_pdf_y_xls_con_el_mismo_contenido_dan_el_mismo_resultado() -> None:
    from_pdf = parse_plan(PdfPlanReader().read((FIXTURES / "plan_sintetico.pdf").read_bytes()))
    from_xls = parse_plan(XlsPlanReader().read((FIXTURES / "plan_sintetico.xls").read_bytes()))
    assert len(from_pdf.subjects) == EXPECTED_SUBJECT_COUNT
    assert from_pdf.subjects == from_xls.subjects
    assert from_pdf.plan_info == from_xls.plan_info


def test_el_resultado_sintetico_tiene_los_estados_esperados() -> None:
    result = parse_plan(PdfPlanReader().read((FIXTURES / "plan_sintetico.pdf").read_bytes()))
    kinds = [s.status.kind if s.status else None for s in result.subjects]
    assert kinds.count("approved") == 6
    assert kinds.count("unparsed") == 1
    assert sum(1 for s in result.subjects if s.is_elective) == 3
    assert all(s.year is None and s.prerequisites is None for s in result.subjects)
