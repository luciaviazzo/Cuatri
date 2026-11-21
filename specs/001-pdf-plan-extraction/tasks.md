---

description: "Tareas para la extracción de materias desde el plan de estudios (PDF o Excel)"
---

# Tasks: Extracción de materias desde el plan de estudios (PDF o Excel)

**Input**: Documentos de diseño en `/specs/001-pdf-plan-extraction/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/plan-extraction.md](contracts/plan-extraction.md), [quickstart.md](quickstart.md)

**Tests**: INCLUIDOS. La constitución (Principio VII) exige casos felices y borde, y Hypothesis para lógica algorítmica del dominio. Cada fase escribe los tests primero y deben fallar antes de implementar.

**Organization**: Tareas agrupadas por historia de usuario del spec (US1, US2, US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede paralelizar (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1, US2, US3)
- Rutas relativas a la raíz del repo, bajo `backend/app/` (no `backend/`)

## Convenciones

- Citas a `data-model.md` con su `Entidad.campo` exacto; las restricciones no se repiten aquí.
- Identificadores en inglés; mensajes y conceptos de dominio en español (Principio X).
- No hay LLM, API keys ni llamadas de red en esta feature (research R-01).
- Los tests de API con TestClient van en `backend/tests/api/`, no en `tests/integration/` (reservado a Testcontainers).
- Los archivos reales con datos personales viven solo en `backend/tests/fixtures/private/` y nunca se commitean.

---

## Phase 1: Setup

- [X] T001 Agregar con `uv add` en `backend/pyproject.toml` las dependencias `pdfplumber`, `python-calamine` y `python-multipart`, y las de desarrollo `hypothesis`, `reportlab` y `xlwt`; actualizar `backend/uv.lock`
- [X] T002 Proteger los datos personales: agregar `backend/tests/fixtures/private/` al `.gitignore` de la raíz y mover ahí `backend/tests/fixtures/plan_estudios.pdf` y `backend/tests/fixtures/plan_estudios.xls` (contienen nombre y legajo del alumno); verificar con `git status` que no quedan sin ignorar
- [X] T003 [P] Agregar `max_upload_bytes` (por defecto 10 MB) a `backend/app/core/config.py`
- [X] T004 [P] Documentar `MAX_UPLOAD_BYTES` en `.env.example` y en `render.yaml`

---

## Phase 2: Foundational (bloquea todas las historias)

**Purpose**: errores, entidades, estructura intermedia, puertos y fixtures que usan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta completar esta fase

- [X] T005 Quitar `status_code` de `DomainError` en `backend/app/domain/errors.py` (Principio I) y agregar `InvalidFileError`, `EmptyFileError`, `NoSubjectsFoundError` y `FileTooLargeError` con los `code` y mensajes en español de la tabla "Errores de dominio" de `data-model.md`
- [X] T006 Mapear `code` → estado HTTP en `backend/app/core/errors.py` según la tabla de errores de `contracts/plan-extraction.md` (incluye `database_unavailable` → 503); confirmar que `backend/tests/unit/test_health.py` sigue en verde sin modificarlo
- [X] T007 [P] Crear `backend/app/domain/text_cleaning.py` con la limpieza de FR-003 (solo espacios sobrantes y saltos de línea partidos; sin cambiar mayúsculas ni tildes), aplicable a `data-model.md` `MateriaExtraida.name`, `MateriaExtraida.group` y `Requisito.text`
- [X] T008 [P] Crear `backend/app/domain/raw_plan.py` con `RawPlan`, `TableRow` y `TextLine` según la sección "Estructura intermedia" de `data-model.md` (sin `Heading`: reconocer títulos es lógica de negocio y vive en el parser)
- [X] T009 [P] Crear `backend/app/domain/file_format.py` con `FileFormat` y `detect_file_format(content)` por firma de contenido (`%PDF-` y la cabecera de documento compuesto de Office), ignorando la extensión (FR-002)
- [X] T010 [P] Crear `backend/app/domain/ports.py` con el Protocol `PlanFileReader` (`read(content: bytes) -> RawPlan`, lanza `InvalidFileError`)
- [X] T011 Crear en `backend/app/domain/plan_extraction.py` las entidades inmutables `Requisito`, `EstadoExtraido`, `MateriaExtraida`, `PlanInfo` y `ResultadoExtraccion`, cumpliendo las restricciones de `data-model.md` para `MateriaExtraida.code`, `MateriaExtraida.name`, `MateriaExtraida.credits`, `MateriaExtraida.group`, `MateriaExtraida.is_elective`, `MateriaExtraida.year`, `MateriaExtraida.prerequisites`, `MateriaExtraida.status`, `Requisito.kind`, `Requisito.text`, `EstadoExtraido.kind`, `EstadoExtraido.grade`, `EstadoExtraido.condition`, `EstadoExtraido.text`, `PlanInfo.program`, `PlanInfo.plan`, `PlanInfo.version`, `ResultadoExtraccion.plan_info` y `ResultadoExtraccion.subjects` (cero materias lanza `NoSubjectsFoundError`; deduplicación por la identidad indicada en `data-model.md`); sin importar FastAPI, SQLAlchemy, pdfplumber ni otras capas (depende de T005 y T007)
- [X] T012 [P] Tests unitarios de las entidades en `backend/tests/unit/domain/test_plan_extraction.py` (crear `__init__.py` del paquete): invariantes de cada campo citado en T011, los tres estados de `prerequisites`, cero materias y duplicados, sin FastAPI ni archivos
- [X] T013 [P] Tests en `backend/tests/unit/domain/test_text_and_format.py`: `detect_file_format` con PDF, documento de Office, imagen renombrada y bytes vacíos; limpieza de texto, con Hypothesis para idempotencia y para que no cambie mayúsculas ni tildes
- [X] T014 [P] Crear el generador `backend/tests/fixtures/make_plan_fixtures.py` y los archivos sintéticos `backend/tests/fixtures/plan_sintetico.pdf` (con `reportlab`) y `backend/tests/fixtures/plan_sintetico.xls` (con `xlwt`) con la misma estructura que las muestras reales: alumno ficticio, módulos y bloques "Materia genérica", un módulo cuya tabla continúa en la página siguiente, un módulo de otra propuesta, encabezado de tabla repetido, materias con nota `N (Promocionado)` y origen `Promoción`, materias sin nota, una nota `2 (Desaprobado)`, y leyendas `(*)`, `(-)`, `(!)` al final. Sin datos personales reales

**Checkpoint**: `cd backend && uv run ruff check . && uv run mypy && uv run lint-imports && uv run pytest` en verde antes de seguir

---

## Phase 3: User Story 1 - Subir el plan (PDF o Excel) y obtener las materias detectadas (Priority: P1) 🎯 MVP

**Goal**: el estudiante sube un PDF o `.xls` del reporte de SIU y recibe el plan y sus materias con código, créditos, módulo, optativa, origen y estado.

**Independent Test**: subir `plan_sintetico.pdf` y `plan_sintetico.xls` al endpoint y verificar que ambos devuelven 200 con las mismas materias y sus campos, sin datos del alumno y sin persistir nada.

### Tests for User Story 1 ⚠️ (escribir primero, deben fallar)

- [X] T015 [P] [US1] Tests de `parse_plan` en `backend/tests/unit/domain/test_plan_parser.py` con `RawPlan` armados a mano: separación `name`/`code`, `credits`, `group` heredado entre bloques, `is_elective` en "Materia genérica", `origin`, nota `9 (Promocionado)` → aprobada, sin nota → `status` `None`, módulo de otra propuesta, leyendas e encabezados repetidos ignorados, duplicados, `PlanInfo`
- [X] T016 [P] [US1] Tests con Hypothesis en `backend/tests/unit/domain/test_plan_parser_properties.py`: el parser nunca produce una materia que no esté en las filas de entrada, nunca produce `approved` sin una nota entre 0 y 10, y mantiene el orden sin duplicados
- [X] T017 [P] [US1] Test del lector de PDF en `backend/tests/unit/adapters/test_pdf_plan_reader.py` (crear `__init__.py`): sobre `plan_sintetico.pdf` emite `TableRow` con 8 celdas (las vacías incluidas) y `TextLine`, en orden de lectura entre páginas
- [X] T018 [P] [US1] Test del lector de XLS en `backend/tests/unit/adapters/test_xls_plan_reader.py`: sobre `plan_sintetico.xls` emite las mismas filas y encabezados que el PDF
- [X] T019 [P] [US1] Test de equivalencia en `backend/tests/unit/test_format_equivalence.py`: `plan_sintetico.pdf` y `plan_sintetico.xls` producen las mismas materias tras `parse_plan`
- [X] T020 [P] [US1] Test del Service con lectores falsos en `backend/tests/unit/services/test_extraccion_plan_service.py` (crear `__init__.py`): elige el lector según el formato detectado y devuelve el resultado
- [X] T021 [P] [US1] Test de API en `backend/tests/api/test_plan_extraction_api.py` (crear `__init__.py`): `POST /planes/extraccion` con ambos archivos sintéticos responde 200 con la forma de `contracts/plan-extraction.md`; el nombre y legajo ficticios del alumno no aparecen en la respuesta ni en los logs capturados (SC-006)

### Implementation for User Story 1

- [X] T022 [US1] Implementar `parse_plan` en `backend/app/domain/plan_parser.py`: reconocimiento de encabezados de grupo (`MÓDULO:` / `MATERIA GENÉRICA:`), mapeo de columnas por nombre de encabezado, conversión de cada fila en `MateriaExtraida` para `code`, `name`, `activity_type`, `credits`, `group`, `is_elective`, `reported_year`, `reported_term` y `origin`, `year` siempre `None`, `PlanInfo` de mejor esfuerzo, deduplicación, e ignorar leyendas, encabezados repetidos, filas vacías y las líneas `Alumno:` y `Legajo:` (depende de T007, T008 y T011)
- [X] T023 [US1] Agregar a `backend/app/domain/plan_parser.py` la regla de estado (FR-007): nota numérica con condición de aprobación entre paréntesis → `EstadoExtraido.kind` `approved` con `EstadoExtraido.grade` y `EstadoExtraido.condition`; celda "en curso" → `in_progress`; cualquier otra nota → `unparsed` con `EstadoExtraido.text`; sin nota → `MateriaExtraida.status` `None`
- [X] T024 [P] [US1] Implementar `backend/app/adapters/pdf_plan_reader.py` con `pdfplumber` implementando `PlanFileReader`: `find_tables()` para las tablas y las líneas de texto fuera de ellas para títulos de módulo y encabezado, ordenados por posición vertical; sin lógica de negocio (los títulos partidos en varias líneas no se unen: ver research R-03)
- [X] T025 [P] [US1] Implementar `backend/app/adapters/xls_plan_reader.py` con `python-calamine` abriendo desde bytes (confirmar `from_filelike`), recorriendo todas las hojas visibles y emitiendo `TableRow` y `TextLine`; solo valores de celdas (FR-021); sin lógica de negocio
- [X] T026 [US1] Implementar `ExtraccionPlanService` en `backend/app/services/extraccion_plan_service.py` dependiendo solo de `app.domain` (nunca de `app.adapters`): `detect_file_format`, selección del lector entre los inyectados y `parse_plan` (depende de T009, T010 y T022)
- [X] T027 [P] [US1] Crear los schemas de respuesta en `backend/app/controllers/schemas/plan_extraction.py` (crear `__init__.py`) reflejando `data-model.md` `MateriaExtraida.code`, `MateriaExtraida.name`, `MateriaExtraida.credits`, `MateriaExtraida.group`, `MateriaExtraida.is_elective`, `MateriaExtraida.year`, `MateriaExtraida.origin`, `MateriaExtraida.prerequisites`, `MateriaExtraida.status` y `PlanInfo.program`, con serialización exacta de decimales
- [X] T028 [US1] Agregar `get_extraccion_plan_service` en `backend/app/core/wiring.py` inyectando los dos lectores por formato (depende de T024, T025 y T026)
- [X] T029 [US1] Crear `backend/app/controllers/plan_router.py` con `POST /planes/extraccion` (`UploadFile`, `response_model`) que solo habla con el Service, sin loguear contenido, y registrar el router en `backend/app/main.py`
- [X] T030 [US1] Ejecutar `uv run lint-imports` y `uv run mypy` en `backend/` y verificar que el endpoint aparece en `http://localhost:8000/docs`

**Checkpoint**: US1 funcional y testeable por sí sola (MVP)

---

## Phase 4: User Story 2 - Distinguir "no sé" de "confirmado que no hay" (Priority: P1)

**Goal**: los datos que el archivo no informa quedan sin asignar o sin determinar y nunca se inventan ni se deducen; un resultado parcial es válido.

**Independent Test**: con el archivo sintético (sin correlativas ni año) todas las materias devuelven `year` `null` y `prerequisites` `null`; con un archivo que sí tiene columna de correlativas, `null`, `[]` y lista con ítems `subject` y `unparsed`.

### Tests for User Story 2 ⚠️

- [X] T031 [P] [US2] Ampliar `backend/tests/fixtures/make_plan_fixtures.py` para generar `backend/tests/fixtures/plan_con_correlativas.pdf` y `.xls`: una columna "Correlativas" con una celda vacía, una "Ninguna", una con varios ítems `Nombre (CÓDIGO)` y una con "CBC aprobado"; y una variante con las columnas Año y Período con valor
- [X] T032 [P] [US2] Tests de parser en `backend/tests/unit/domain/test_plan_parser_partial.py`: sin columna de correlativas → `MateriaExtraida.prerequisites` `None`; celda vacía → `None`; "Ninguna" o "-" → `()`; ítem `Nombre (CÓDIGO)` → `subject`; otro texto → `unparsed`; `MateriaExtraida.year` siempre `None` aunque haya Año/Período; esos valores van a `reported_year` y `reported_term`; un resultado con datos faltantes es válido
- [X] T033 [P] [US2] Test de API en `backend/tests/api/test_plan_extraction_semantics.py`: el JSON distingue `null`, `[]` y lista con ítems `{kind, text}`, y los estados `approved`, `in_progress` y `unparsed`, con ambos formatos

### Implementation for User Story 2

- [X] T034 [US2] Agregar a `backend/app/domain/plan_parser.py` el reconocimiento de la columna opcional "Correlativas" o "Requisitos" y la construcción de `MateriaExtraida.prerequisites` con `Requisito.kind` y `Requisito.text` según `research.md` R-06 (separador `;`; `subject` solo con la forma `Nombre (CÓDIGO)`)
- [X] T035 [US2] Verificar en `backend/app/controllers/schemas/plan_extraction.py` que la serialización no descarta `null` ni listas vacías (sin `exclude_none`), preservando la distinción de `data-model.md` `MateriaExtraida.prerequisites` y `MateriaExtraida.status`
- [X] T036 [P] [US2] Crear el test de aceptación `backend/tests/acceptance/test_real_samples.py` (crear `__init__.py`) que se salta si no existe `backend/tests/fixtures/private/`: sobre las muestras reales verifica 61 materias, 24 aprobadas con nota, `year` y `prerequisites` `None` en todas, igualdad de materias entre PDF y XLS, y ausencia de datos personales en el resultado serializado

**Checkpoint**: US1 y US2 funcionan juntas sin romperse

---

## Phase 5: User Story 3 - Rechazo claro de archivos no procesables (Priority: P2)

**Goal**: archivos inválidos, vacíos, demasiado grandes o sin materias se rechazan con un mensaje por causa, sin resultados vacíos ni stack traces.

**Independent Test**: subir un archivo vacío, una imagen renombrada `.pdf` y `.xls`, un documento de otro formato, un PDF y un Excel sin materias y un archivo sobre el límite, y verificar los códigos de `contracts/plan-extraction.md`.

### Tests for User Story 3 ⚠️

- [X] T037 [P] [US3] Tests del Service en `backend/tests/unit/services/test_extraccion_plan_service_errors.py`: vacío → `EmptyFileError`; excedido → `FileTooLargeError`; formato no detectado → `InvalidFileError`; cero materias → `NoSubjectsFoundError`
- [X] T038 [P] [US3] Tests de los lectores en `backend/tests/unit/adapters/test_plan_readers_errors.py`: PDF corrupto o protegido, documento de Office que no es un libro de Excel y `.xls` truncado → `InvalidFileError`; PDF y Excel válidos sin tablas reconocibles → `RawPlan` sin filas
- [X] T039 [P] [US3] Tests de API en `backend/tests/api/test_plan_extraction_errors.py`: estado HTTP y `code` de cada fila de la tabla de errores de `contracts/plan-extraction.md` (400, 413, 422 ×3), campo `file` ausente → `validation_error`, y que ningún cuerpo de error contenga stack trace ni contenido del archivo

### Implementation for User Story 3

- [X] T040 [US3] Agregar al Service en `backend/app/services/extraccion_plan_service.py` las validaciones de vacío, tamaño máximo (inyectado) y formato no detectado, antes de invocar los lectores
- [X] T041 [US3] Hacer que `backend/app/adapters/pdf_plan_reader.py` y `backend/app/adapters/xls_plan_reader.py` conviertan cualquier falla de apertura (corrupto, protegido, no es un libro de Excel) en `InvalidFileError`
- [X] T042 [US3] En `backend/app/controllers/plan_router.py` leer el archivo con tope de `max_upload_bytes + 1` bytes y declarar las respuestas de error con `responses=` para que OpenAPI las genere automáticamente
- [X] T043 [US3] Verificar con T039 que el handler global de `backend/app/core/errors.py` devuelve `{"error": {"code", "message"}}` para los códigos nuevos y que `/health` no se ve afectado

**Checkpoint**: las tres historias funcionan de forma independiente

---

## Phase 6: Polish & Cross-Cutting

- [X] T044 [P] Test en `backend/tests/api/test_openapi.py` que verifica que `/openapi.json` incluye la ruta, el schema de respuesta y las respuestas de error (Principio VIII, sin escribir documentación a mano)
- [X] T045 [P] Actualizar `README.md` con el endpoint, los formatos soportados, `MAX_UPLOAD_BYTES` y la carpeta `tests/fixtures/private/`
- [X] T046 Correr en `backend/`: `uv run ruff check . && uv run mypy && uv run lint-imports && uv run pytest`; probar además que un import de `app.adapters` desde `app.services` o de `pdfplumber` desde `app.domain` hace fallar `lint-imports`, agregando el contrato correspondiente en `backend/pyproject.toml` si no existe
- [X] T047 Levantar `docker compose up --build` y recorrer los escenarios 1 a 11 de `quickstart.md` con las muestras reales
- [ ] T048 **Bloqueada por deploy**: deployar el backend en Render, confirmar que la imagen instala `pdfplumber` y `python-calamine`, y repetir los escenarios 1, 2 y 8 de `quickstart.md` contra la URL pública (Principio IX); la feature no se da por terminada hasta entonces

---

## Notas de implementación

- Desviaciones respecto del diseño original, ya reflejadas en `data-model.md` y `research.md`: el título de grupo omite el segmento raíz `Plan basico` (el PDF lo omite en las genéricas y el XLS no); `Requisito.text` conserva el código (`Nombre (CÓDIGO)`); las correlativas se separan solo por `;`; `pdfminer` se silencia a nivel WARNING porque en DEBUG registra el contenido del PDF, incluidos datos del alumno.
- T048 sigue pendiente: requiere el backend deployado.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; T002 debe hacerse antes de cualquier commit
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias
- **US1, US2, US3**: dependen de Foundational. US2 y US3 extienden archivos creados en US1 (`plan_parser.py`, `extraccion_plan_service.py`, `plan_router.py`, los dos lectores), así que se hacen **en orden** US1 → US2 → US3
- **Polish**: depende de las tres historias; T048 depende además del deploy

### Dentro de cada historia

- Tests primero (deben fallar), luego Dominio, lectores, Service, schemas, wiring y Controller
- T011 depende de T005 y T007; T022 de T007, T008 y T011; T026 de T009, T010 y T022; T028 de T024, T025 y T026

### Parallel Opportunities

- Setup: T003 y T004 en paralelo; Foundational: T007–T010 en paralelo, luego T012–T014
- US1: T015–T021 en paralelo; T024, T025 y T027 en paralelo
- US2: T031–T033 y T036 en paralelo; US3: T037–T039 en paralelo

## Parallel Example: User Story 1

```text
# Tests de US1 juntos:
T015 test_plan_parser.py          T017 test_pdf_plan_reader.py
T016 test_plan_parser_properties  T018 test_xls_plan_reader.py

# Implementación en paralelo:
T024 pdf_plan_reader.py   T025 xls_plan_reader.py   T027 schemas/plan_extraction.py
```

## Implementation Strategy

### MVP First (solo US1)

1. Setup → Foundational → US1.
2. **Detenerse y validar** con los archivos sintéticos y, si están, los reales privados.
3. Sumar US2 (semántica de datos faltantes y correlativas) y US3 (errores).

### Notas

- US1 y US2 son ambas P1: con el formato de SIU, US2 ya está casi cubierta por US1 (año y correlativas siempre sin dato); su trabajo propio es la columna opcional de correlativas y las verificaciones.
- Preguntas abiertas del plan (Q-01, Q-02, Q-05, Q-07, Q-08, Q-09) pueden cambiar la ruta (T029), el límite (T003) y el alcance (`.xlsx`).
- El usuario es quien commitea; el asistente solo propone el nombre de commit.
