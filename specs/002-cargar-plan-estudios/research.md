# Research: Carga y Configuración del Plan de Estudios

**Feature**: `002-cargar-plan-estudios`
**Date**: 2026-10-08

---

## Decisión 1 — Formato del archivo de entrada

**Decision**: JSON estructurado como formato principal; YAML como alternativa futura opcional.

**Rationale**: JSON es parse nativo en Node.js sin dependencias extra. La estructura requerida
(materias por año con correlativas opcionales) es plana y no se beneficia de la legibilidad de
YAML en el caso de uso típico (archivo generado o exportado, no escrito a mano). Un solo parser
simplifica el manejo de errores y el contrato del endpoint.

**Alternatives considered**:
- YAML: más legible para archivos escritos a mano, pero requiere dependencia adicional (`js-yaml`)
  y dos parsers aumentan la superficie de errores. Se puede agregar como segunda opción en una
  feature futura sin cambiar el modelo.
- CSV: demasiado plano para expresar correlativas de forma natural.
- Excel/PDF: fuera del alcance por complejidad de parsing y dependencias.

**File format contract**:
```json
{
  "materias": [
    {
      "nombre": "Análisis Matemático I",
      "anio": 1,
      "correlativas": []
    },
    {
      "nombre": "Álgebra",
      "anio": 1,
      "correlativas": []
    },
    {
      "nombre": "Análisis Matemático II",
      "anio": 2,
      "correlativas": ["Análisis Matemático I"]
    }
  ]
}
```

Las correlativas se referencian por **nombre** dentro del mismo archivo (no por ID, que no existe
aún). El sistema resuelve los nombres a IDs internos después de validar que todos los nombres
referenciados existen en el plan. Esto simplifica el archivo y es más robusto ante errores del
usuario que usar IDs artificiales.

---

## Decisión 2 — Detección de ciclos

**Decision**: DFS (Depth-First Search) iterativo sobre el grafo de dependencias como función de
dominio pura; se retorna el ciclo detectado (par o lista de nodos) junto con el rechazo.

**Rationale**: El grafo de correlativas es un DAG dirigido. DFS detecta ciclos en O(V+E) y es
comprensible. La función recibe `Map<string, string[]>` (nombre → correlativas) y devuelve
`{ hasCycle: true, cycle: string[] } | { hasCycle: false }`. No depende de NestJS ni TypeORM —
candidata directa para property-based testing con fast-check (Principio VII).

**Property-based test invariants**:
- Un grafo sin aristas no tiene ciclos.
- Un grafo con arista A→A tiene ciclo.
- Un grafo construido como DAG topológico nunca tiene ciclos.
- Un grafo con ciclo A→B→A siempre lo detecta independientemente del orden de inserción.

**Alternatives considered**:
- Algoritmo de Kahn (BFS topológico): igualmente válido, pero el error de ciclo en DFS devuelve
  el path del ciclo directamente, lo que mejora el mensaje de rechazo al usuario.

---

## Decisión 3 — Separación parsing / validación de dominio

**Decision**: Dos funciones separadas en `backend/src/domain/`:
1. `parsePlanFile(raw: unknown): ParsedMateria[]` — valida estructura JSON (campos requeridos,
   tipos); lanza `ParseError` si el JSON no cumple el contrato.
2. `buildPlanDeEstudios(materias: ParsedMateria[], carreraId: string): PlanDeEstudios` — valida
   reglas de dominio (unicidad de nombres, referencias de correlativas existentes, sin ciclos);
   lanza `DomainError` con detalle del problema.

**Rationale**: Permite testear la validación estructural (con inputs malformados) y la validación
de dominio (con inputs bien formados pero inválidos semánticamente) de forma completamente
independiente, sin duplicar fixtures. Cada capa puede evolucionar sin afectar a la otra.

---

## Decisión 4 — Estrategia de reemplazo de plan

**Decision**: Reemplazo transaccional completo: dentro de una transacción TypeORM, se borra el
plan activo anterior (cascade sobre materias y correlativas) y se inserta el nuevo. Si algo falla,
la transacción hace rollback y el plan anterior permanece intacto.

**Rationale**: Satisface SC-004 (atomicidad: o todo o nada). Evita lógica de diff/merge que
generaría ambigüedades con materias renombradas o correlativas cambiadas. El riesgo de referencias
huérfanas desde historial académico (Feature 2) está documentado como deuda aceptada en la spec.

**Alternatives considered**:
- Soft-delete + nuevo plan activo: permite auditoría pero complica la query de "plan activo" en
  todas las features subsiguientes. Se puede agregar como mejora futura.
- Diff incremental: demasiado complejo para el valor que aporta hoy.

---

## Decisión 5 — Persistencia de correlativas

**Decision**: Tabla intermedia `materia_correlativa` con columnas `(materia_id, correlativa_id)`,
ambas FK a `materia.id`. Relación many-to-many auto-referencial dentro del mismo plan.

**Rationale**: Es el modelo relacional natural. TypeORM lo soporta con `@ManyToMany` y
`@JoinTable`. El cascade delete desde `plan_de_estudios` borra en cadena materias y luego
correlativas gracias al `ON DELETE CASCADE` en las FKs.

---

## Decisión 6 — Endpoint de carga: multipart vs JSON con base64

**Decision**: `multipart/form-data` con el archivo como campo `file` y `carreraId` como campo
separado.

**Rationale**: Convención estándar para carga de archivos en APIs REST. NestJS lo soporta con
`@UseInterceptors(FileInterceptor)` + `@UploadedFile()`. Tamaño máximo configurable via
`MulterOptions`. El archivo JSON del plan raramente supera unos pocos KB, por lo que no hay
restricción práctica.

**Alternatives considered**:
- JSON con contenido del archivo como string base64: posible pero no idiomático; complica el
  debug al inspeccionar requests.

---

## Decisión 7 — Indicador "pendiente de configuración"

**Decision**: Campo `correlativasCompletas: boolean` calculado en la capa de servicio al construir
la respuesta; NO persiste en DB. Una materia tiene `correlativasCompletas = false` si su lista de
correlativas está vacía.

**Rationale**: Principio III (estados derivados no se persisten). El estado es determinístico a
partir de los datos: `correlativas.length === 0` implica que el archivo no trajo correlativas para
esa materia. El usuario puede marcarlo manualmente agregando correlativas. Una vez que agrega al
menos una, desaparece el indicador.

**Note**: Este campo no distingue entre "la materia genuinamente no tiene correlativas" y "el
archivo no las incluyó". La distinción queda fuera del alcance de esta feature (decisión
documentada en spec).
