# Quickstart — Carga y Configuración del Plan de Estudios

**Feature**: `002-cargar-plan-estudios`
**Spec**: [spec.md](spec.md) | **Contrato API**: [contracts/plan-estudios.yml](contracts/plan-estudios.yml) | **Modelo**: [data-model.md](data-model.md)

---

## Requisitos previos

- Node.js 20 (`nvm use` desde la raíz del repo)
- Docker en ejecución
- Variables de entorno configuradas: `cp .env.example .env`

---

## Levantar el entorno

```bash
# 1. Base de datos
docker compose up -d

# 2. Backend (en una terminal separada)
cd backend
npm install
npm run start:dev   # http://localhost:3000  |  Swagger: http://localhost:3000/api/docs

# 3. Frontend (en otra terminal)
cd frontend
npm install
npm run dev         # http://localhost:5173
```

---

## Archivo de plan de ejemplo

Guardar como `plan-ejemplo.json`:

```json
{
  "materias": [
    { "nombre": "Análisis Matemático I", "anio": 1, "correlativas": [] },
    { "nombre": "Álgebra",              "anio": 1, "correlativas": [] },
    { "nombre": "Programación I",       "anio": 1, "correlativas": [] },
    { "nombre": "Análisis Matemático II","anio": 2, "correlativas": ["Análisis Matemático I"] },
    { "nombre": "Programación II",      "anio": 2, "correlativas": ["Programación I"] },
    { "nombre": "Estructura de Datos",  "anio": 2, "correlativas": ["Programación I", "Álgebra"] }
  ]
}
```

Archivo con ciclo para test negativo (`plan-ciclico.json`):

```json
{
  "materias": [
    { "nombre": "Materia A", "anio": 1, "correlativas": ["Materia B"] },
    { "nombre": "Materia B", "anio": 1, "correlativas": ["Materia A"] }
  ]
}
```

---

## Escenarios de validación

### Escenario 1 — Carga de plan válido (User Story 1, SC-001)

```bash
# Obtener el ID de la carrera (debe existir una carrera seeded en la DB)
curl http://localhost:3000/carreras

# Cargar el plan (reemplazar <carreraId> con el ID obtenido)
curl -X POST http://localhost:3000/carreras/<carreraId>/plan \
  -F "file=@plan-ejemplo.json"
```

**Resultado esperado**: HTTP 201. El body incluye `materias` con 6 entradas; las materias
"Análisis Matemático I", "Álgebra" y "Programación I" tienen `correlativasCompletas: false`
(sin correlativas en el archivo); las demás tienen `correlativasCompletas: true`.

---

### Escenario 2 — Reemplazo de plan existente (US1 AS2)

```bash
# Cargar el mismo endpoint con un archivo distinto sobre la misma carrera
curl -X POST http://localhost:3000/carreras/<carreraId>/plan \
  -F "file=@plan-ejemplo-reducido.json"
```

**Resultado esperado**: HTTP 201. El plan anterior ya no existe; solo aparecen las materias
del nuevo archivo.

---

### Escenario 3 — Rechazo por plan con ciclo (US1 AS6)

```bash
curl -X POST http://localhost:3000/carreras/<carreraId>/plan \
  -F "file=@plan-ciclico.json"
```

**Resultado esperado**: HTTP 422. El body tiene `error` con el ciclo identificado
(`"Materia A → Materia B → Materia A"`). El plan anterior permanece sin cambios.

---

### Escenario 4 — Agregar correlativa manual (User Story 2, SC-003)

```bash
# Obtener IDs de materias del plan activo
curl http://localhost:3000/carreras/<carreraId>/plan

# Agregar correlativa a "Análisis Matemático I" (que quedó sin correlativas)
curl -X POST \
  http://localhost:3000/carreras/<carreraId>/plan/materias/<materiaId>/correlativas \
  -H "Content-Type: application/json" \
  -d '{"correlativaId": "<otraMateriaId>"}'
```

**Resultado esperado**: HTTP 200. La materia devuelta tiene `correlativasCompletas: true`
y la nueva correlativa aparece en el array `correlativas`.

---

### Escenario 5 — Rechazo de correlativa que crea ciclo (US2 AS4)

```bash
curl -X POST \
  http://localhost:3000/carreras/<carreraId>/plan/materias/<materiaAId>/correlativas \
  -H "Content-Type: application/json" \
  -d '{"correlativaId": "<materiaBId>"}'
# (donde B ya tiene A como correlativa)
```

**Resultado esperado**: HTTP 422 con `error` describiendo el ciclo que se formaría.

---

### Escenario 6 — Quitar correlativa (US2 AS2)

```bash
curl -X DELETE \
  "http://localhost:3000/carreras/<carreraId>/plan/materias/<materiaId>/correlativas?correlativaId=<corrId>"
```

**Resultado esperado**: HTTP 200. La correlativa ya no aparece en el array `correlativas`
de la materia. Las demás materias del plan no se ven afectadas.

---

## Tests automatizados

```bash
# Tests unitarios de dominio (sin DB, incluye property-based con fast-check)
cd backend && npm test

# Tests de integración y e2e con Testcontainers (requiere Docker)
cd backend && npm run test:e2e
```

**Cobertura esperada tras la implementación**:

| Tipo        | Qué cubre                                                               |
|-------------|-------------------------------------------------------------------------|
| Unitario    | `detectarCiclos` (property-based), `buildPlanDeEstudios`, `parsePlanFile` |
| Integración | Carga completa, reemplazo, agregar/quitar correlativa vía HTTP          |
| E2e         | Plan válido, plan cíclico rechazado, edición manual de correlativa      |

---

## Interfaz web (frontend)

1. Navegar a `http://localhost:5173`.
2. Pantalla de carga: seleccionar carrera (dropdown) y subir `plan-ejemplo.json`.
3. El sistema navega a la pantalla de revisión: materias agrupadas por año, correlativas listadas,
   materias sin correlativas marcadas visualmente como "pendiente de configuración".
4. En una materia "pendiente", usar el formulario inline para agregar una correlativa (buscar por
   nombre) y confirmar.
5. El indicador "pendiente" desaparece una vez agregada la primera correlativa.
