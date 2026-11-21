# Implementation Plan: Extracción de materias desde el plan de estudios (PDF o Excel)

**Branch**: `001-pdf-plan-extraction` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-pdf-plan-extraction/spec.md`

## Summary

El estudiante sube el reporte "Plan de estudios" de SIU Guaraní (PDF o `.xls`); el backend detecta
el formato por contenido, lo lee, lo interpreta con reglas determinísticas y devuelve un resultado
de revisión (sin persistir) con los datos del plan y las materias (código, nombre, créditos, módulo,
optativa, origen, estado). El año del plan y las correlativas quedan sin asignar / sin determinar
porque este formato no los informa.

**Cambio de enfoque respecto del plan anterior**: ya no se usa un LLM. Los archivos reales de muestra
son tablas con encabezados fijos y se interpretan con reglas simples; eso elimina el envío de datos
personales a un tercero, la API key, el costo y el no determinismo (ver [research.md](research.md)
R-01). Arquitectura: dos Adapters de lectura (PDF con `pdfplumber`, XLS con `python-calamine`) que
producen una estructura intermedia, y una función pura del Dominio que la interpreta. Detalle en
[research.md](research.md), [data-model.md](data-model.md) y [contracts/](contracts/).

## Technical Context

**Language/Version**: Python 3.12

**Primary Dependencies**: FastAPI + Pydantic v2 (existentes); nuevas: `pdfplumber`,
`python-calamine`, `python-multipart` (carga de archivos en FastAPI); dev: `hypothesis`,
`reportlab` (PDF sintético), `xlwt` (XLS sintético)

**Storage**: N/A (el resultado no se persiste)

**Testing**: pytest + httpx TestClient + Hypothesis; fixtures sintéticos versionados y muestras
reales privadas (ignoradas por git) que se saltan si no están

**Target Platform**: Linux (contenedor en Render); desarrollo en Windows/Docker

**Project Type**: web-service (solo backend en esta feature)

**Performance Goals**: respuesta en menos de 5 s para archivos de hasta 20 páginas (SC-001)

**Constraints**: tamaño máximo 10 MB configurable; sin OCR; sin persistencia; sin servicios de
terceros ni secretos; sin datos personales del alumno en respuestas ni logs

**Scale/Scope**: un endpoint, un archivo por solicitud, sin cuenta

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|-----------|--------|-------|
| I. Capas backend | PASS con ajuste | El Service no importa Adapters: usa el puerto `PlanFileReader` (Dominio) con lectores inyectados desde `app/core/wiring.py`. La lógica de negocio (`parse_plan`) es pura y vive en el Dominio. Hay que quitar `status_code` de `DomainError` (el Dominio no conoce HTTP). |
| II. Capas frontend | N/A | Solo backend; la pantalla de carga es otra feature (Q-05). |
| III. Estados derivados | PASS | Solo aprobada (con nota) y en curso; el resto, texto literal. Equivalencias: el origen se devuelve literal, sin crear un quinto estado. |
| IV. Reglas extensibles | PASS | Los requisitos no interpretados se conservan literales, listos para ser reglas más adelante. |
| V. Auth opcional | PASS | El endpoint no exige login. |
| VI. Validación por nivel | PASS | Pydantic: forma del request (campo `file`). Service: vacío, tamaño y formato. Dominio: invariantes (cero materias, nota 0–10, sin duplicados). Handler global único. |
| VII. Testing | PASS con justificación | Unit de dominio sin FastAPI; Hypothesis para limpieza, deduplicación e invariantes del parser; import-linter; muestras reales opcionales. Testcontainers no aplica (no hay base de datos). |
| VIII. OpenAPI automática | PASS | `response_model` y `responses=` generan el esquema; `contracts/` es diseño, no documentación de la API. |
| IX. Definición de terminado | **BLOQUEADO hasta el deploy** | Exige verificar contra el deploy real; el backend aún no está deployado. |
| X. Idioma | PASS | Identificadores en inglés; conceptos de dominio y mensajes en español. |
| XI. Spec-first | PASS | Spec actualizado con las muestras reales antes de rehacer plan y tareas. |

**Post-diseño**: igual. El único gate abierto es IX (deploy), una precondición de infraestructura.

## Project Structure

### Documentation (this feature)

```text
specs/001-pdf-plan-extraction/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── plan-extraction.md
└── tasks.md             # lo genera /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── domain/
│   │   ├── plan_extraction.py      # MateriaExtraida, Requisito, EstadoExtraido, PlanInfo, ResultadoExtraccion
│   │   ├── raw_plan.py             # RawPlan, Heading, TableRow, TextLine (estructura intermedia)
│   │   ├── plan_parser.py          # parse_plan(RawPlan) -> ResultadoExtraccion (lógica de negocio pura)
│   │   ├── file_format.py          # FileFormat, detect_file_format
│   │   ├── text_cleaning.py        # limpieza de nombres (FR-003)
│   │   ├── ports.py                # PlanFileReader (Protocol)
│   │   └── errors.py               # excepciones del dominio (existente, se amplía)
│   ├── adapters/
│   │   ├── pdf_plan_reader.py      # pdfplumber -> RawPlan
│   │   └── xls_plan_reader.py      # python-calamine -> RawPlan
│   ├── services/
│   │   └── extraccion_plan_service.py
│   ├── controllers/
│   │   ├── plan_router.py          # POST /planes/extraccion (ruta tentativa)
│   │   └── schemas/plan_extraction.py
│   └── core/
│       ├── config.py               # + MAX_UPLOAD_BYTES
│       ├── errors.py               # mapeo code -> HTTP
│       └── wiring.py               # + servicio con los dos lectores
└── tests/
    ├── unit/                       # domain, adapters, services
    ├── api/                        # TestClient (no usa Testcontainers)
    ├── acceptance/                 # muestras reales (se saltan si no están)
    └── fixtures/
        ├── make_plan_fixtures.py   # generador de PDF/XLS sintéticos
        ├── plan_sintetico.pdf / .xls
        └── private/                # muestras reales con datos personales (ignorada por git)
```

**Structure Decision**: se mantiene la estructura por capas de `backend/app/`. Los tests de API van
en `tests/api/`, dejando `tests/integration/` reservado a Testcontainers.

## Preguntas abiertas (a resolver antes de `/speckit-implement`)

- **Q-01**: nombre final de la ruta (`/planes/extraccion` es tentativo).
- **Q-02**: límite de tamaño: el spec dice 10 MB (se usa configurable); si la UI diseñada dice
  20 MB, hay que alinear.
- **Q-05**: este plan cubre solo el backend (probable por Swagger); la pantalla de carga queda para
  otra feature.
- **Q-07**: condiciones de aprobación: solo se reconocen "Promocionado" y "Aprobado". ¿Hay otras en
  planes reales (por ejemplo para exámenes finales)? Mientras tanto, se devuelven literales.
- **Q-08**: `.xlsx` fuera de alcance; ¿se incluye? Es el formato moderno de Excel.
- **Q-09**: las muestras reales tienen datos personales y hoy están sin ignorar por git: hay que
  moverlas a `tests/fixtures/private/` (tarea T002) antes de cualquier commit.

*Resueltas por el cambio de enfoque*: ya no aplican Q-03 (error por falla del LLM), Q-04 (fixture:
se recibieron las muestras) ni Q-06 (política de datos de Gemini: no se usa).

## Complexity Tracking

Sin violaciones que justificar. Los dos lectores separados implementan un mismo puerto y el parser
es único, lo que mantiene el diseño simple.
