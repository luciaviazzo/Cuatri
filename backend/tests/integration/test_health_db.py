"""Test de integración con Postgres real vía testcontainers (requiere Docker).

Se corre con: uv run pytest -m integration
"""

from collections.abc import Iterator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from testcontainers.postgres import PostgresContainer

from app.repositories.health_repository import HealthRepository


@pytest.fixture(scope="session")
def pg_url() -> Iterator[str]:
    with PostgresContainer("postgres:16-alpine", driver="psycopg") as pg:
        yield pg.get_connection_url()


@pytest.mark.integration
def test_ping_contra_postgres_real(pg_url: str) -> None:
    engine = create_engine(pg_url)
    with Session(engine) as session:
        assert HealthRepository(session).ping() is True
