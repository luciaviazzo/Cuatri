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

## Pantalla "Cargá tu carrera" (`/cargar-carrera`)

El botón "+ Cargar mi primera carrera" del inicio lleva a `/cargar-carrera`: se elige o se arrastra el
reporte "Plan de estudios" (PDF o Excel `.xls`, hasta 10 MB), se analiza con `POST /planes/extraccion`
y se revisan las materias agrupadas por módulo. El resultado **solo se muestra: no se guarda** y se
pierde al salir o recargar; el nombre y el legajo del reporte nunca se muestran.

- Usa `VITE_API_URL` (ver `.env.example`); sin ella apunta a `http://localhost:8000`.
- Al entrar dispara un `GET /health` para despertar al backend gratuito de Render; a los 10 s de
  análisis avisa que puede demorar y a los 60 s lo trata como servicio no disponible.
- **CORS**: el backend solo acepta los orígenes de `CORS_ORIGINS`. Las vistas previas de Vercel y el
  desarrollo local contra el backend de Render requieren sumar ese origen en Render.
- Tests del frontend: `cd frontend && npm test` (Vitest + React Testing Library).

## Deploy

**Backend (Render)**: New → Blueprint → este repo (`render.yaml` crea el web service Docker y la Postgres gestionada).
Después setear `CORS_ORIGINS` = URL pública de Vercel.

**Frontend (Vercel)**: importar el repo con *Root Directory* = `frontend`; variable `VITE_API_URL` = URL pública del backend en Render.

**CI**: GitHub Actions (`.github/workflows/ci.yml`): ruff, mypy, import-linter y pytest en el backend; lint, tipos, Vitest y build en el frontend.

Variables: ver `.env.example`.
