# Modelo de la interfaz: Cargar la carrera

No hay datos persistentes. Esta feature define los tipos que espejan la API, el estado de la pantalla
y las funciones puras de presentación. Tipos en `src/types/`; textos en
`src/pages/careerUploadCopy.ts`; constantes en `src/config.ts`.

## Constantes (`config.ts`)

| Constante | Valor | Regla |
|-----------|-------|-------|
| `MAX_UPLOAD_BYTES` | `10 * 1024 * 1024` | Replica el límite por defecto del backend (FR-002, FR-005) |
| `ACCEPTED_EXTENSIONS` | `['.pdf', '.xls']` | Sin distinguir mayúsculas |
| `SLOW_AFTER_MS` | `10_000` | Aviso amable de demora (FR-007) |
| `ABORT_AFTER_MS` | `60_000` | Se aborta y se trata como servicio no disponible (FR-007) |
| `API_URL` | `VITE_API_URL` o `http://localhost:8000` | Sin `/` final |

## Tipos de la API (`types/plan.ts`)

Espejo de [contracts/api-consumption.md](contracts/api-consumption.md). Los decimales llegan como
texto.

| Tipo | Campos | Regla |
|------|--------|-------|
| `PlanInfo` | `program`, `plan`, `version`: `string \| null` | Opcionales: si faltan, no se muestran |
| `Requisito` | `kind: 'subject' \| 'unparsed'`, `text` | No se muestra en esta pantalla (las correlativas figuran "sin determinar") |
| `Estado` | `kind: 'approved' \| 'in_progress' \| 'unparsed'`, `grade`, `condition`, `text` | `grade` y `condition` solo con `approved`; `text` solo con `unparsed` |
| `Materia` | `code`, `name`, `activity_type`, `credits`, `group`, `is_elective`, `year`, `reported_year`, `reported_term`, `origin`, `prerequisites`, `status` | `name` siempre presente; `code`, `credits` y `group` pueden ser `null`; `year` y `prerequisites` llegan `null` con el formato de SIU |
| `ExtractionResult` | `plan_info: PlanInfo`, `subjects: Materia[]` | Al menos una materia |

## Estado de la pantalla (`types/extraction.ts`, `hooks/usePlanExtraction.ts`)

`ExtractionErrorCode`: `invalid_file` | `empty_file` | `file_too_large` | `no_subjects_found` |
`service_unavailable`.

| Estado | Campos | Significado |
|--------|--------|-------------|
| `idle` | — | Sin archivo elegido |
| `selected` | `file: File` | Archivo válido listo para analizar |
| `analyzing` | `file: File`, `slow: boolean` | Envío en curso; `slow` pasa a `true` a los 10 s |
| `success` | `result: ExtractionResult` | Resultado listo para revisar (solo en memoria) |
| `error` | `code: ExtractionErrorCode`, `file: File \| null`, `canRetry: boolean` | Causa del error; `canRetry` es `true` solo con `service_unavailable` y archivo presente |

### Transiciones

| Desde | Evento | Hacia |
|-------|--------|-------|
| `idle` / `selected` / `error` | elegir archivo válido | `selected` (reemplaza al anterior) |
| `idle` / `selected` / `error` | elegir archivo no válido (formato, tamaño, vacío) | `error` con la causa, sin enviar |
| `selected` | analizar | `analyzing` (`slow: false`) |
| `analyzing` | 10 s sin respuesta | `analyzing` (`slow: true`) |
| `analyzing` | respuesta exitosa | `success` |
| `analyzing` | error del servicio o de red | `error` (con `canRetry` según la causa) |
| `analyzing` | 60 s sin respuesta | `error` (`service_unavailable`) |
| `analyzing` | analizar otra vez | sin cambio (se ignora: un solo envío) |
| `error` con `canRetry` | reintentar | `analyzing` con el mismo archivo |
| `success` / `error` | "Cargar otro archivo" | `idle` |
| cualquiera | salir de la pantalla | se aborta lo pendiente y se descarta todo |

## Funciones puras (`utils/`)

| Función | Entrada → salida | Regla |
|---------|------------------|-------|
| `validateFile(file)` | `File` → `ExtractionErrorCode \| null` | Vacío → `empty_file`; supera `MAX_UPLOAD_BYTES` → `file_too_large`; extensión no aceptada → `invalid_file`; si no, `null` |
| `groupByModule(subjects)` | `Materia[]` → `{ name: string \| null; subjects: Materia[] }[]` | Orden de primera aparición; las de `group` `null` quedan en "Sin módulo" |
| `countApproved(subjects)` | `Materia[]` → `number` | Cuenta las de `status.kind === 'approved'` |
| `formatCredits(text)` | `"10.00"` → `"10"`; `"4.50"` → `"4,5"`; `null` → `"sin dato"` | Sin ceros sobrantes y con coma decimal |
| `formatFileSize(bytes)` | `number` → texto | `B`, `KB` o `MB` con un decimal como máximo |

## Vista derivada del resultado

- **Resumen**: `program`, `plan` y `version` solo si no son `null`; cantidad de materias =
  `subjects.length`; aprobadas = `countApproved`. La cantidad del resumen y la suma de los módulos
  deben coincidir (SC-002).
- **Materia**: código (o "sin dato"), nombre, créditos formateados, chip de optativa si
  `is_elective`, y chip de estado según `status` (ver [research.md](research.md) R-08).
- **Siempre "sin determinar"**: año del plan y correlativas, con una nota única de pantalla (no por
  materia).
