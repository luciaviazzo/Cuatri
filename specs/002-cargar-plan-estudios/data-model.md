# Data Model: Carga y Configuración del Plan de Estudios

**Feature**: `002-cargar-plan-estudios`
**Date**: 2026-10-08

---

## Entidades de dominio

### Carrera

Unidad académica a la que pertenece un plan de estudios.

| Campo  | Tipo   | Restricciones                          |
|--------|--------|----------------------------------------|
| id     | string | UUID, generado por DB                  |
| nombre | string | Requerido, único en el sistema, max 200 |
| codigo | string | Requerido, único en el sistema, max 20  |

**Relaciones**:
- Tiene cero o un `PlanDeEstudios` activo.

**Validaciones de dominio**:
- `nombre` no puede estar vacío.
- `codigo` no puede estar vacío.

---

### PlanDeEstudios

Conjunto completo de materias de una carrera, organizado por año.

| Campo     | Tipo      | Restricciones                                 |
|-----------|-----------|-----------------------------------------------|
| id        | string    | UUID, generado por DB                         |
| carreraId | string    | FK → Carrera.id, requerido                    |
| creadoEn  | Date      | Timestamp UTC, generado en insert             |
| materias  | Materia[] | Lista no vacía; mínimo 1 materia              |

**Relaciones**:
- Pertenece a exactamente una `Carrera`.
- Contiene una o más `Materia`.

**Validaciones de dominio**:
- La lista de materias no puede estar vacía (rechazo FR-004).
- Los nombres de materias dentro del plan deben ser únicos (edge case de spec).
- No puede contener correlativas circulares.
- Toda correlativa debe referenciar una materia que exista en el mismo plan.

**Restricción de reemplazo**:
- Una `Carrera` tiene a lo sumo un `PlanDeEstudios` activo. Cargar un nuevo plan reemplaza el
  anterior de forma transaccional (ver research.md Decisión 4).

---

### Materia

Unidad curricular dentro de un plan de estudios.

| Campo       | Tipo     | Restricciones                                       |
|-------------|----------|-----------------------------------------------------|
| id          | string   | UUID, generado por DB                               |
| planId      | string   | FK → PlanDeEstudios.id, requerido                   |
| nombre      | string   | Requerido, único dentro del mismo plan, max 200     |
| anio        | number   | Entero ≥ 1, requerido                               |
| correlativas| Materia[]| Lista de materias del mismo plan; puede estar vacía |

**Relaciones**:
- Pertenece a exactamente un `PlanDeEstudios`.
- Puede tener cero o más `Materia` como correlativas (auto-referencial many-to-many).

**Estado derivado** (NO persiste):
- `correlativasCompletas: boolean` = `correlativas.length > 0`

**Validaciones de dominio**:
- `nombre` no puede estar vacío.
- `anio` debe ser un entero mayor o igual a 1.
- Una materia no puede ser correlativa de sí misma (ciclo directo).
- Agregar una correlativa no puede crear un ciclo en el grafo.

---

## Esquema de persistencia

### Tablas

```sql
-- Tabla: carrera
CREATE TABLE carrera (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre  VARCHAR(200) NOT NULL UNIQUE,
  codigo  VARCHAR(20)  NOT NULL UNIQUE
);

-- Tabla: plan_de_estudios
CREATE TABLE plan_de_estudios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrera_id  UUID NOT NULL REFERENCES carrera(id) ON DELETE CASCADE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(carrera_id)   -- un plan activo por carrera
);

-- Tabla: materia
CREATE TABLE materia (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id  UUID         NOT NULL REFERENCES plan_de_estudios(id) ON DELETE CASCADE,
  nombre   VARCHAR(200) NOT NULL,
  anio     SMALLINT     NOT NULL CHECK (anio >= 1),
  UNIQUE(plan_id, nombre)   -- nombre único dentro del plan
);

-- Tabla intermedia: materia_correlativa
CREATE TABLE materia_correlativa (
  materia_id      UUID NOT NULL REFERENCES materia(id) ON DELETE CASCADE,
  correlativa_id  UUID NOT NULL REFERENCES materia(id) ON DELETE CASCADE,
  PRIMARY KEY (materia_id, correlativa_id),
  CHECK (materia_id <> correlativa_id)   -- no autocorrelativa
);
```

### Índices adicionales recomendados

```sql
CREATE INDEX idx_materia_plan_id ON materia(plan_id);
CREATE INDEX idx_materia_correlativa_materia_id ON materia_correlativa(materia_id);
CREATE INDEX idx_materia_correlativa_correlativa_id ON materia_correlativa(correlativa_id);
```

---

## Objetos de dominio (TypeScript, sin decoradores ORM)

```typescript
// domain/carrera.ts
interface Carrera {
  id: string;
  nombre: string;
  codigo: string;
}

// domain/materia.ts
interface Materia {
  id: string;
  planId: string;
  nombre: string;
  anio: number;
  correlativaIds: string[];   // IDs de otras materias del mismo plan
}

// domain/plan-de-estudios.ts
interface PlanDeEstudios {
  id: string;
  carreraId: string;
  creadoEn: Date;
  materias: Materia[];
}
```

---

## Objetos de parsing (antes de validación de dominio)

```typescript
// domain/parsed-materia.ts
interface ParsedMateria {
  nombre: string;
  anio: number;
  correlativasNombres: string[];   // nombres crudos del archivo; se resuelven a IDs
}
```

---

## Variables de entorno

No se añaden variables nuevas. Las variables DB_* existentes en `.env.example` son suficientes.
El tamaño máximo del archivo subido puede configurarse en `MulterOptions` dentro del módulo
NestJS, sin variable de entorno (valor razonable: 1 MB).
