# Modelo de datos: Extracción de materias desde PDF o Excel

No se persiste nada; todo es en memoria. Las entidades viven en `app/domain/plan_extraction.py` y
son inmutables. Campos en inglés (Principio X); conceptos de dominio en español.

## MateriaExtraida

| Campo | Tipo | Regla |
|-------|------|-------|
| `code` | `str \| None` | Último token entre paréntesis al final de "Actividad" (por ejemplo `80000`, `8003N`); sin espacios; no forma parte de `name`. `None` si no figura (FR-003) |
| `name` | `str` | No vacío; tal como figura, quitando solo espacios sobrantes y saltos de línea partidos; sin cambiar mayúsculas ni tildes (FR-003) |
| `activity_type` | `str \| None` | Texto literal de la columna Tipo (por ejemplo `Materia`) (FR-004) |
| `credits` | `Decimal \| None` | ≥ 0; `None` si falta o es ilegible (FR-004) |
| `group` | `str \| None` | Título del módulo o bloque "Materia genérica" donde figura, sin el prefijo `MÓDULO:` / `MATERIA GENÉRICA:` ni el segmento raíz `Plan basico` (el PDF lo omite en las genéricas y el XLS no), con los segmentos unidos por ` / ` y limpiado como `name` (FR-005) |
| `is_elective` | `bool` | Verdadero si figura dentro de un bloque "Materia genérica" (FR-005) |
| `year` | `int \| None` | Año del plan. `None` = sin asignar; nunca deducido del módulo ni de Año/Período (FR-009). El formato SIU siempre lo deja `None` |
| `reported_year` | `str \| None` | Texto literal de la columna Año, si tiene valor (FR-008) |
| `reported_term` | `str \| None` | Texto literal de la columna Período, si tiene valor (FR-008) |
| `origin` | `str \| None` | Texto literal de la columna Origen (por ejemplo `Promoción`) (FR-008) |
| `prerequisites` | `tuple[Requisito, ...] \| None` | `None` = **sin determinar**; `()` = **confirmado sin correlativas** (solo si el archivo lo dice); con ítems = lista detectada (FR-010) |
| `status` | `EstadoExtraido \| None` | `None` = sin nota ni estado (FR-007) |

Identidad para deduplicar (FR-022): `code` si existe; si no, el `name` en minúsculas sin tildes.

## Requisito

| Campo | Tipo | Regla |
|-------|------|-------|
| `kind` | `"subject" \| "unparsed"` | `subject` = ítem con forma `Nombre (CÓDIGO)`; `unparsed` = cualquier otro texto (por ejemplo "CBC aprobado"). Los ítems se separan con `;` (FR-011) |
| `text` | `str` | No vacío; limpiado como `name`; para `subject` conserva el código, para poder cruzarlo después |

No se valida que un `subject` exista entre las materias extraídas (FR-019).

## EstadoExtraido

| Campo | Tipo | Regla |
|-------|------|-------|
| `kind` | `"approved" \| "in_progress" \| "unparsed"` | `approved`: nota numérica entre 0 y 10 + condición de aprobación entre paréntesis. `in_progress`: la celda dice "en curso" (sin distinguir mayúsculas). Todo lo demás: `unparsed` (FR-007) |
| `grade` | `Decimal \| None` | Solo con `approved`; entre 0 y 10 |
| `condition` | `str \| None` | Solo con `approved`; texto entre paréntesis (por ejemplo `Promocionado`) |
| `text` | `str \| None` | Solo con `unparsed`; texto literal de la celda |

Condiciones de aprobación reconocidas (sin distinguir mayúsculas ni tildes): `Promocionado`,
`Aprobado`. Una nota con otra condición, o un número suelto, es `unparsed`.

## PlanInfo

| Campo | Tipo | Regla |
|-------|------|-------|
| `program` | `str \| None` | Carrera (texto de "Propuesta:" sin el código inicial entre paréntesis) (FR-013) |
| `plan` | `str \| None` | Plan (por ejemplo `2019`) (FR-013) |
| `version` | `str \| None` | Versión (por ejemplo `7`); `None` si no se reconoce (FR-013) |

Nunca incluye nombre, legajo ni otros datos del alumno (FR-014). El PDF y el Excel escriben plan y
versión de forma distinta (`2019-7` vs `7`); el reconocimiento es de mejor esfuerzo.

## ResultadoExtraccion

| Campo | Tipo | Regla |
|-------|------|-------|
| `plan_info` | `PlanInfo` | Siempre presente; campos `None` si no se reconocen |
| `subjects` | `tuple[MateriaExtraida, ...]` | Mínimo 1; sin duplicados (FR-022) |

**Invariante**: cero materias → `NoSubjectsFoundError` (FR-015, FR-017).

## Estructura intermedia (`app/domain/raw_plan.py`)

Ambos lectores producen lo mismo: `RawPlan(blocks: tuple[RawBlock, ...])`, en orden de lectura, donde
cada bloque es `TableRow(cells)` (una fila de tabla) o `TextLine(text)` (una línea fuera de las
tablas). Los lectores no reconocen títulos ni leyendas: eso lo hace el parser (una fila de una sola
celda se trata como texto, así el XLS, que lo emite todo como filas, es equivalente al PDF). El Dominio interpreta
este objeto con `parse_plan` y no conoce PDF ni Excel.

## Puertos y formato

- `PlanFileReader.read(content: bytes) -> RawPlan`: lanza `InvalidFileError` si el contenido no se
  puede abrir (corrupto, protegido, no es un libro de Excel, etc.).
- `FileFormat` (`PDF`, `XLS`) y `detect_file_format(content) -> FileFormat | None`, por firma de
  contenido: `%PDF-` y la cabecera de documento compuesto de Office (`D0CF11E0A1B11AE1`).

## Errores de dominio

| Excepción | `code` | Mensaje (español) |
|-----------|--------|-------------------|
| `InvalidFileError` | `invalid_file` | El formato no es soportado o el archivo no es válido (se aceptan PDF y Excel .xls) |
| `EmptyFileError` | `empty_file` | El archivo está vacío |
| `NoSubjectsFoundError` | `no_subjects_found` | No se encontraron materias en el documento |
| `FileTooLargeError` | `file_too_large` | El archivo supera el tamaño máximo permitido |

## Respuesta HTTP (schema de Controller)

Mismos campos que el dominio, con `prerequisites` como `null` | lista (vacía o con ítems
`{kind, text}`) y `status` como `null` | `{kind, grade, condition, text}`. Los números decimales se
serializan como texto o número exacto (se define al implementar sin perder precisión). Vive en
`app/controllers/schemas/plan_extraction.py`.
