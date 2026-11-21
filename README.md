# Cuatri

Monorepo: `backend/` (FastAPI + SQLAlchemy 2 + PostgreSQL) y `frontend/` (React 19 + Vite + Tailwind 4).

## Local: un solo comando

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000 · health: `/health` · Swagger: `/docs`

Las migraciones (`alembic upgrade head`) corren al arrancar el backend.

## Desarrollo sin Docker para la app

```bash
docker compose up -d db
cd backend && uv sync && uv run uvicorn app.main:app --reload
cd frontend && npm ci && npm run dev
```

## Calidad (lo mismo que corre CI)

```bash
cd backend
uv run ruff check . && uv run mypy && uv run lint-imports && uv run pytest
uv run pytest -m integration   # testcontainers, requiere Docker (en Windows: TESTCONTAINERS_RYUK_DISABLED=true)
cd ../frontend
npm run lint && npm test && npm run build
```

`lint-imports` falla el build si se viola la arquitectura (ver `[tool.importlinter]` en `backend/pyproject.toml`).

## Arquitectura backend

`controllers → services → repositories/adapters`, con `domain` puro (sin FastAPI/SQLAlchemy).
`app/core/wiring.py` es el único lugar que compone services con repositories.
Errores: siempre `{"error": {"code", "message", "details?"}}`, sin stack traces.

## Extracción de plan de estudios

`POST /planes/extraccion` (ruta tentativa) recibe un `multipart/form-data` con el campo `file`: el
reporte "Plan de estudios" de SIU Guaraní en **PDF** o **Excel (.xls)**. El formato se detecta por
el contenido, no por la extensión. Devuelve las materias (código, nombre, créditos, módulo,
optativa, origen, estado) como resultado de revisión; **no guarda nada**. El año del plan y las
correlativas quedan `null` ("sin determinar") porque ese reporte no los trae. No se devuelve ni se
registra el nombre ni el legajo del alumno. Sin servicios externos ni API keys.

- Tamaño máximo: `MAX_UPLOAD_BYTES` (10 MB por defecto).
- Errores: `empty_file` (400), `file_too_large` (413), `invalid_file` (422), `no_subjects_found` (422).
- Los tests usan archivos sintéticos (`backend/tests/fixtures/`, regenerables con
  `uv run python -m tests.fixtures.make_plan_fixtures`). Las muestras reales tienen datos
  personales y van en `backend/tests/fixtures/private/` (ignorada por git); si están, corren los
  tests de `tests/acceptance/`.

## Deploy

**Backend (Render)**: New → Blueprint → este repo (`render.yaml` crea el web service Docker y la Postgres gestionada).
Después setear `CORS_ORIGINS` = URL pública de Vercel.

**Frontend (Vercel)**: importar el repo con *Root Directory* = `frontend`; variable `VITE_API_URL` = URL pública del backend en Render.

**CI**: GitHub Actions (`.github/workflows/ci.yml`). Para SonarCloud: crear el proyecto, completar `sonar.organization` y
`sonar.projectKey` en `sonar-project.properties` y agregar el secret `SONAR_TOKEN` al repo.

Variables: ver `.env.example`.
