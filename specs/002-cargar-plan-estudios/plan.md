# Implementation Plan: Carga y Configuración del Plan de Estudios

**Branch**: `002-cargar-plan-estudios` | **Date**: 2026-10-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-cargar-plan-estudios/spec.md`

---

## Summary

Permite cargar un archivo JSON con las materias de una carrera (agrupadas por año, con correlativas
opcionales), construir el `PlanDeEstudios` validando reglas de dominio (unicidad de nombres,
correlativas existentes, sin ciclos), persistirlo reemplazando el plan anterior de forma
transaccional, y editar correlativas manualmente una vez cargado el plan.

---

## Technical Context

**Language/Version**: TypeScript 6 (strict) — Node.js 20

**Primary Dependencies**:
- Backend: NestJS 12, TypeORM, `@nestjs/platform-express` (Multer para file upload),
  `class-validator`, `class-transformer`, `@nestjs/swagger`
- Testing: Vitest, fast-check, testcontainers@10, @testcontainers/postgresql@10, supertest

**Storage**: PostgreSQL 16 — tablas `carrera`, `plan_de_estudios`, `materia`, `materia_correlativa`

**Testing**:
- Unitarios de dominio: Vitest + fast-check (property-based para detección de ciclos)
- Integración/e2e: Vitest + testcontainers@10 + supertest (PostgreSQL efímero)
- Arquitectura: tsarch (ya configurado en `backend/test/arch.spec.ts`)

**Target Platform**: Linux server (CI) / Windows local (dev)

**Project Type**: Web service (REST API) + SPA

**Performance Goals**: SC-001 — respuesta completa en menos de 30 segundos desde upload

**Constraints**:
- Archivo de entrada: máximo 1 MB (MulterOptions en el módulo NestJS)
- Atomicidad: o todo el plan carga, o el anterior permanece intacto (SC-004)
- Sin auth requerida (Principio V)

**Scale/Scope**: Una carrera hoy (UNQ); modelo ya distingue carrera desde el día uno (ver spec
decisión de diseño)

---

## Constitution Check

| Principio | Estado | Notas |
|-----------|--------|-------|
| I — Capas backend (Controller→Service→{Domain,Repo,Adapter}) | ✅ | `PlanController` → `PlanService` → {dominio puro, `PlanRepository`, `CarreraRepository`} |
| II — Capas frontend (service/hooks/components/pages) | ✅ | `service/plan.ts`, `hooks/usePlan.ts`, `pages/CargarPlan.tsx`, `pages/RevisionPlan.tsx` |
| III — Estados derivados | ✅ | `correlativasCompletas` NO persiste; se calcula en service a partir de `correlativas.length` |
| IV — Requisitos extensibles | ✅ | No aplica directamente en esta feature (los requisitos de habilitación son Feature 2) |
| V — Auth opcional | ✅ | Ningún endpoint de esta feature requiere login |
| VI — Validación por nivel | ✅ | DTO valida forma; Service valida existencia de carrera/materia; Dominio valida ciclos e invariantes |
| VII — Testing | ✅ | Unitarios de dominio sin DB; property-based para `detectarCiclos`; e2e con Testcontainers |
| VIII — Swagger desde decoradores | ✅ | Todos los endpoints documentados con `@ApiTags`, `@ApiBody`, `@ApiResponse` |
| IX — Definición de terminado | ✅ | Tests en verde + compilación + Swagger actualizado |
| X — Idioma | ✅ | Identificadores en inglés, mensajes de error y nombres de dominio en español |
| XI — Spec-first | ✅ | Spec completa y validada (16/16 ✅) antes de este plan |

**GATE: Sin violaciones. Proceder.**

---

## Project Structure

### Documentation (this feature)

```text
specs/002-cargar-plan-estudios/
├── plan.md              ← este archivo
├── research.md          ← decisiones técnicas (formato archivo, ciclos, reemplazo, etc.)
├── data-model.md        ← entidades de dominio, esquema SQL, interfaces TypeScript
├── quickstart.md        ← escenarios de validación manual y comandos de test
├── contracts/
│   └── plan-estudios.yml  ← OpenAPI 3.0 con los 5 endpoints
└── tasks.md             ← generado por /speckit-tasks (pendiente)
```

### Source Code

```text
backend/
├── src/
│   ├── controllers/
│   │   └── plan.controller.ts        # POST /carreras/:id/plan, GET, POST/DELETE correlativas
│   ├── services/
│   │   ├── plan-carga.service.ts     # orquesta parseo → validación → reemplazo transaccional
│   │   └── correlativa.service.ts   # agregar / quitar correlativa sobre plan existente
│   ├── domain/
│   │   ├── carrera.ts               # interface Carrera
│   │   ├── materia.ts               # interface Materia, interface ParsedMateria
│   │   ├── plan-de-estudios.ts      # interface PlanDeEstudios + buildPlanDeEstudios()
│   │   ├── parse-plan-file.ts       # parsePlanFile(raw: unknown): ParsedMateria[]
│   │   └── detectar-ciclos.ts       # detectarCiclos(grafo): { hasCycle, cycle? }
│   ├── repositories/
│   │   ├── carrera.repository.ts    # findAll(), findById()
│   │   └── plan.repository.ts       # findByCarreraId(), save(), replaceForCarrera()
│   ├── entities/
│   │   ├── carrera.entity.ts        # @Entity carrera
│   │   ├── plan-de-estudios.entity.ts # @Entity plan_de_estudios
│   │   └── materia.entity.ts        # @Entity materia + @ManyToMany correlativas
│   └── migrations/
│       └── (migration generada: CreatePlanDeEstudiosSchema)
├── test/
│   ├── arch.spec.ts                 # ya existente — sin cambios
│   ├── domain/
│   │   ├── detectar-ciclos.spec.ts  # unitario + property-based (fast-check)
│   │   ├── parse-plan-file.spec.ts  # unitario — inputs malformados
│   │   └── build-plan.spec.ts       # unitario — reglas de dominio
│   └── plan.e2e-spec.ts            # integración con Testcontainers
└── vitest.config.ts                # ya existente

frontend/
├── src/
│   ├── service/
│   │   └── plan.ts                 # uploadPlan(), getPlan(), addCorrelativa(), removeCorrelativa()
│   ├── hooks/
│   │   └── usePlan.ts              # estado del plan, loading, error
│   ├── pages/
│   │   ├── CargarPlan.tsx          # selector de carrera + file input + submit
│   │   └── RevisionPlan.tsx        # materias por año, indicador pendiente, form correlativa
│   ├── components/
│   │   ├── MateriaCard.tsx         # card con nombre, año, correlativas, badge pendiente
│   │   └── CorrelativaForm.tsx     # agregar/quitar correlativa (inline)
│   └── types/
│       └── plan.ts                 # PlanDeEstudiosDetalle, MateriaDetalle, etc.
```

---

## Complexity Tracking

> Sin violaciones de constitución. Sección no aplica.

---

## Implementation Order

1. **Dominio puro** (`domain/`): interfaces, `parsePlanFile`, `detectarCiclos`, `buildPlanDeEstudios`
   → tests unitarios + property-based en paralelo
2. **Persistencia**: entities TypeORM, migration, repositories
3. **Servicios de aplicación**: `PlanCargaService`, `CorrelativaService`
4. **Controller + DTOs + Swagger**
5. **Frontend**: en paralelo con el controller una vez el contrato OpenAPI está fijo
   (`plan.ts` service → `usePlan` hook → páginas + componentes)
6. **Tests e2e** con Testcontainers: carga válida, ciclo rechazado, reemplazo, edición correlativa

---

## Notes on Key Design Decisions

Ver [research.md](research.md) para la justificación completa de:

- **Formato de archivo**: JSON con correlativas referenciadas por nombre (no por ID)
- **Detección de ciclos**: DFS en dominio puro, candidato a property-based testing
- **Separación parsing/dominio**: `parsePlanFile` ≠ `buildPlanDeEstudios`
- **Reemplazo transaccional**: DELETE cascade + INSERT dentro de una transacción TypeORM
- **`correlativasCompletas`**: campo derivado, no persiste (Principio III)
- **Formato upload**: `multipart/form-data` con campo `file`
