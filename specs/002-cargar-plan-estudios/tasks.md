# Tasks: Carga y ConfiguraciÃ³n del Plan de Estudios

**Input**: Design documents from `specs/002-cargar-plan-estudios/`

**Prerequisites**: [plan.md](plan.md) Â· [spec.md](spec.md) Â· [data-model.md](data-model.md) Â· [contracts/plan-estudios.yml](contracts/plan-estudios.yml) Â· [research.md](research.md)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias incompletas)
- **[US1]**: User Story 1 â€” Carga inicial del plan de estudios (P1)
- **[US2]**: User Story 2 â€” ConfiguraciÃ³n manual de correlativas (P2)

---

## Phase 1: Setup (Infraestructura compartida)

**Objetivo**: instalar dependencias nuevas y preparar la estructura de carpetas necesaria para esta feature. No hay cÃ³digo de aplicaciÃ³n en esta fase.

- [x] T001 Instalar dependencias de backend para upload: verificar que `@nestjs/platform-express` y `@types/multer` estÃ¡n en `backend/package.json`; si faltan, agregarlos con `npm install`
- [x] T002 Instalar `fast-check` en devDependencies del backend: `npm install -D fast-check` en `backend/`
- [x] T003 [P] Crear carpeta `backend/src/domain/` si no existe (ya puede existir del scaffold)
- [x] T004 [P] Crear carpeta `backend/src/entities/` para entidades TypeORM
- [x] T005 [P] Crear carpeta `backend/src/repositories/` para repositorios
- [x] T006 [P] Crear carpeta `backend/test/domain/` para tests unitarios de dominio
- [x] T007 [P] Crear carpeta `backend/src/migrations/` si no existe (ya puede existir del scaffold)

---

## Phase 2: Foundational (Prerequisitos bloqueantes)

**Objetivo**: modelo de dominio puro, parsing, detecciÃ³n de ciclos y entidades TypeORM â€” todo lo que US1 y US2 necesitan antes de empezar.

**âš ï¸ CRÃTICO**: ninguna tarea de US1 ni US2 puede comenzar hasta completar esta fase.

### Interfaces de dominio

- [x] T008 [P] Crear `backend/src/domain/carrera.ts` con la interface `Carrera { id: string; nombre: string; codigo: string }` (sin decoradores ORM)
- [x] T009 [P] Crear `backend/src/domain/materia.ts` con las interfaces `Materia { id: string; planId: string; nombre: string; anio: number; correlativaIds: string[] }` y `ParsedMateria { nombre: string; anio: number; correlativasNombres: string[] }` (sin decoradores ORM)
- [x] T010 Crear `backend/src/domain/plan-de-estudios.ts` con la interface `PlanDeEstudios { id: string; carreraId: string; creadoEn: Date; materias: Materia[] }` (depende de T009)

### FunciÃ³n de parsing

- [x] T011 Implementar `backend/src/domain/parse-plan-file.ts`: funciÃ³n `parsePlanFile(raw: unknown): ParsedMateria[]` que valida que el input sea `{ materias: Array<{ nombre: string; anio: number; correlativas?: string[] }> }`, lanza `ParseError` (clase de error propia) si falta algÃºn campo requerido, `nombre` estÃ¡ vacÃ­o, o `anio` no es entero â‰¥ 1; devuelve la lista de `ParsedMateria`
- [x] T012 Escribir tests unitarios en `backend/test/domain/parse-plan-file.spec.ts`: casos felices (JSON vÃ¡lido con y sin correlativas), casos borde (array vacÃ­o â†’ error, materia sin nombre â†’ error, materia con anio=0 â†’ error, materia con anio no entero â†’ error, correlativas vacÃ­as â†’ ok, campo extra ignorado â†’ ok)

### FunciÃ³n de detecciÃ³n de ciclos

- [x] T013 Implementar `backend/src/domain/detectar-ciclos.ts`: funciÃ³n `detectarCiclos(grafo: Map<string, string[]>): { hasCycle: false } | { hasCycle: true; cycle: string[] }` usando DFS; el ciclo devuelto es el path completo del ciclo detectado para incluir en el mensaje de error
- [x] T014 Escribir tests unitarios + property-based en `backend/test/domain/detectar-ciclos.spec.ts`:
  - Casos con ejemplos: sin aristas â†’ sin ciclo; Aâ†’A â†’ ciclo; Aâ†’Bâ†’A â†’ ciclo; Aâ†’B, Aâ†’C â†’ sin ciclo; cadena larga sin ciclo â†’ sin ciclo
  - Property-based con fast-check: (1) `fc.array(fc.string())` construido como DAG topolÃ³gico nunca tiene ciclo; (2) cualquier grafo con arista de vuelta siempre detecta ciclo; (3) grafo vacÃ­o nunca tiene ciclo

### ConstrucciÃ³n del plan de estudios con validaciÃ³n de dominio

- [x] T015 Implementar `backend/src/domain/build-plan-de-estudios.ts`: funciÃ³n `buildPlanDeEstudios(materias: ParsedMateria[], carreraId: string): PlanDeEstudios` que (a) rechaza lista vacÃ­a, (b) rechaza nombres duplicados dentro del plan, (c) resuelve nombres de correlativas a IDs internos temporales y rechaza referencias a nombres inexistentes, (d) llama a `detectarCiclos` y rechaza si hay ciclo; lanza `DomainError` con mensaje en espaÃ±ol en cada caso (depende de T011, T013)
- [x] T016 Escribir tests unitarios en `backend/test/domain/build-plan.spec.ts`: lista vacÃ­a â†’ error; nombre duplicado â†’ error; correlativa referencia nombre inexistente â†’ error; ciclo Aâ†’Bâ†’A â†’ error; plan vÃ¡lido sin correlativas â†’ ok; plan vÃ¡lido con correlativas â†’ ok; mensaje de error del ciclo incluye los nombres involucrados

### Entidades TypeORM

- [x] T017 [P] Crear `backend/src/entities/carrera.entity.ts`: `@Entity('carrera')` con campos `@PrimaryGeneratedColumn('uuid') id`, `@Column({ length: 200, unique: true }) nombre`, `@Column({ length: 20, unique: true }) codigo`
- [x] T018 [P] Crear `backend/src/entities/plan-de-estudios.entity.ts`: `@Entity('plan_de_estudios')` con `@PrimaryGeneratedColumn('uuid') id`, `@ManyToOne(() => CarreraEntity) carrera`, `@CreateDateColumn() creadoEn`, `@OneToMany(() => MateriaEntity, m => m.plan) materias`; constraint `UNIQUE(carrera_id)` via `@Unique(['carrera'])`
- [x] T019 Crear `backend/src/entities/materia.entity.ts`: `@Entity('materia')` con `@PrimaryGeneratedColumn('uuid') id`, `@ManyToOne(() => PlanDeEstudiosEntity, ..., { onDelete: 'CASCADE' }) plan`, `@Column({ length: 200 }) nombre`, `@Column({ type: 'smallint' }) anio`; mÃ¡s `@ManyToMany(() => MateriaEntity, { cascade: true }) @JoinTable({ name: 'materia_correlativa', ... }) correlativas: MateriaEntity[]`; constraint `@Unique(['plan', 'nombre'])` (depende de T018)
- [x] T020 Crear migraciÃ³n TypeORM `backend/src/migrations/<timestamp>-CreatePlanDeEstudiosSchema.ts` que genera las 4 tablas del data-model.md: `carrera`, `plan_de_estudios`, `materia`, `materia_correlativa` con todos los Ã­ndices y constraints documentados; registrar la migraciÃ³n en `backend/src/app.module.ts` en el array `migrations`
- [x] T021 Registrar las nuevas entidades en `backend/src/app.module.ts` en el array `entities` de `TypeOrmModule.forRootAsync`: `CarreraEntity`, `PlanDeEstudiosEntity`, `MateriaEntity`

### Repositorios

- [x] T022 [P] Crear `backend/src/repositories/carrera.repository.ts`: clase con `findAll(): Promise<Carrera[]>` y `findById(id: string): Promise<Carrera | null>`; usa `CarreraEntity` internamente con mapper explÃ­cito a la interface de dominio `Carrera`
- [x] T023 Crear `backend/src/repositories/plan.repository.ts`: clase con `findByCarreraId(carreraId: string): Promise<PlanDeEstudios | null>` (carga materias + correlativas eager), `replaceForCarrera(carreraId: string, plan: PlanDeEstudios): Promise<PlanDeEstudios>` (dentro de una transacciÃ³n TypeORM: borra el plan anterior si existe y guarda el nuevo), `findMateriaById(id: string): Promise<Materia | null>`, `updateMateria(materia: Materia): Promise<Materia>` (depende de T019, T022)

**Checkpoint**: dominio puro completo y testeado, entidades y repositorios listos â€” US1 y US2 pueden comenzar.

---

## Phase 3: User Story 1 â€” Carga inicial del plan de estudios (P1) ðŸŽ¯ MVP

**Goal**: el usuario puede subir un archivo JSON y obtener el plan de estudios de la carrera creado con todas sus materias, correlativas derivadas e indicador de configuraciÃ³n pendiente.

**Independent Test**: `POST /carreras/:id/plan` con `plan-ejemplo.json` devuelve HTTP 201 con 6 materias; las 3 sin correlativas tienen `correlativasCompletas: false`; re-subir el archivo devuelve el plan nuevo (plan anterior reemplazado). Ver [quickstart.md](quickstart.md) escenarios 1 y 2.

### Servicio de carga

- [x] T024 [US1] Implementar `backend/src/services/plan-carga.service.ts`: mÃ©todo `cargarPlan(carreraId: string, fileBuffer: Buffer): Promise<PlanDeEstudiosDetalle>` que (1) verifica que la carrera existe via `CarreraRepository`, (2) llama a `parsePlanFile`, (3) llama a `buildPlanDeEstudios`, (4) llama a `PlanRepository.replaceForCarrera`; propaga `ParseError` y `DomainError` sin atraparlos (el controller los mapea); agrega campo derivado `correlativasCompletas` en el objeto de respuesta (depende de T015, T022, T023)

### DTOs y Controller

- [x] T025 [US1] Crear `backend/src/controllers/dtos/plan-response.dto.ts` con `CorrelativaResumenDto { id: string; nombre: string }`, `MateriaDetalleDto { id, nombre, anio, correlativas: CorrelativaResumenDto[], correlativasCompletas: boolean }`, `PlanDeEstudiosDetalleDto { id, carreraId, creadoEn, materias: MateriaDetalleDto[] }` con decoradores `@ApiProperty` en cada campo
- [x] T026 [US1] Crear `backend/src/controllers/carrera.controller.ts`: endpoint `GET /carreras` con `@ApiTags('Plan de Estudios')`, `@ApiOkResponse`, delega a `CarreraRepository.findAll()`, devuelve array de `{ id, nombre, codigo }`
- [x] T027 [US1] Crear `backend/src/controllers/plan.controller.ts`: endpoint `POST /carreras/:carreraId/plan` con `@UseInterceptors(FileInterceptor('file'))`, `@UploadedFile()`, `@ApiConsumes('multipart/form-data')`, `@ApiBody` con schema del archivo, delega a `PlanCargaService.cargarPlan`; captura `ParseError` y `DomainError` y los mapea a `HttpException(422)`; captura `NotFoundException` (carrera no existe) y la mapea a 404; tambiÃ©n agrega endpoint `GET /carreras/:carreraId/plan` que delega a `PlanRepository.findByCarreraId` y devuelve `PlanDeEstudiosDetalleDto` (depende de T024, T025)
- [x] T028 [US1] Registrar `CarreraController`, `PlanController`, `PlanCargaService`, `CarreraRepository`, `PlanRepository` en un nuevo `PlanModule` y agregar `PlanModule` a los imports de `AppModule` en `backend/src/app.module.ts`
- [x] T029 [US1] Agregar `MulterModule.register({ limits: { fileSize: 1_048_576 } })` en `PlanModule` para limitar uploads a 1 MB

### Tests de integraciÃ³n US1

- [x] T030 [US1] Escribir tests de integraciÃ³n en `backend/test/plan.e2e-spec.ts` con `PostgreSqlContainer` de testcontainers@10 (patrÃ³n idÃ©ntico al de `health.e2e-spec.ts`): (a) POST con plan vÃ¡lido â†’ 201 + materias con `correlativasCompletas` correcto; (b) POST con plan vÃ¡lido sobre carrera con plan existente â†’ 201 + plan anterior reemplazado; (c) POST con archivo vacÃ­o â†’ 422; (d) POST con materia sin anio â†’ 422; (e) POST con correlativa referencia nombre inexistente â†’ 422; (f) POST con ciclo Aâ†’Bâ†’A â†’ 422 con mensaje que incluye los nombres; (g) GET plan activo â†’ 200; (h) GET carrera sin plan â†’ 404

### Frontend US1

- [x] T031 [P] [US1] Crear `frontend/src/types/plan.ts` con los tipos TypeScript que replican el contrato de la API: `CarreraResumen`, `CorrelativaResumen`, `MateriaDetalle`, `PlanDeEstudiosDetalle`, `AgregarCorrelativaRequest`
- [x] T032 [P] [US1] Crear `frontend/src/service/plan.ts` con funciones: `getCarreras(): Promise<CarreraResumen[]>`, `uploadPlan(carreraId: string, file: File): Promise<PlanDeEstudiosDetalle>`, `getPlan(carreraId: string): Promise<PlanDeEstudiosDetalle>` â€” todas usan `httpClient` existente en `service/httpClient.ts` (depende de T031)
- [x] T033 [P] [US1] Crear `frontend/src/hooks/usePlan.ts`: hook que expone `{ plan, loading, error, cargarPlan }` usando `service/plan.ts`; `cargarPlan(carreraId, file)` llama a `uploadPlan` y actualiza el estado local (depende de T032)
- [x] T034 [US1] Crear `frontend/src/pages/CargarPlan.tsx`: pÃ¡gina con selector de carrera (llama a `getCarreras()` al montar), file input que acepta `.json`, botÃ³n "Cargar plan", manejo de error inline (muestra el mensaje de rechazo del API), navegaciÃ³n a `/revision` con el plan en estado tras Ã©xito; usa Tailwind 4 con `text-primary`, `bg-surface` del `@theme` definido en `index.css` (depende de T033)
- [x] T035 [P] [US1] Crear `frontend/src/components/MateriaCard.tsx`: componente que recibe `MateriaDetalle` y muestra nombre, aÃ±o, lista de correlativas y badge "Pendiente de configuraciÃ³n" (color `accent-yellow`) cuando `correlativasCompletas === false`; sin lÃ³gica HTTP propia (depende de T031)
- [x] T036 [US1] Crear `frontend/src/pages/RevisionPlan.tsx`: pÃ¡gina que recibe el plan (vÃ­a estado de navegaciÃ³n o contexto), agrupa materias por aÃ±o, renderiza `MateriaCard` por cada materia; sin formulario de ediciÃ³n aÃºn (eso es US2) (depende de T033, T035)
- [x] T037 [US1] Configurar routing en `frontend/src/main.tsx` o equivalente: rutas `/` â†’ `CargarPlan`, `/revision` â†’ `RevisionPlan` usando React Router v6 (instalar si no estÃ¡: `npm install react-router-dom` en `frontend/`)

**Checkpoint**: User Story 1 completamente funcional â€” subir plan, ver materias por aÃ±o con indicador de pendientes.

---

## Phase 4: User Story 2 â€” ConfiguraciÃ³n manual de correlativas (P2)

**Goal**: el usuario puede agregar o quitar correlativas de cualquier materia desde la pantalla de revisiÃ³n.

**Independent Test**: con el plan ya cargado, `POST /carreras/:id/plan/materias/:mid/correlativas` agrega una correlativa y el campo `correlativasCompletas` pasa a `true`; `DELETE` con `?correlativaId=` la elimina. Ver [quickstart.md](quickstart.md) escenarios 4, 5 y 6.

### Servicio de ediciÃ³n de correlativas

- [x] T038 [US2] Implementar `backend/src/services/correlativa.service.ts`: mÃ©todo `agregarCorrelativa(carreraId: string, materiaId: string, correlativaId: string): Promise<MateriaDetalle>` que (1) verifica que la carrera y el plan activo existen, (2) verifica que ambas materias pertenecen al mismo plan, (3) construye el grafo de correlativas del plan completo + la arista nueva y llama a `detectarCiclos`, rechaza si hay ciclo, (4) persiste via `PlanRepository.updateMateria`; mÃ©todo `quitarCorrelativa(carreraId: string, materiaId: string, correlativaId: string): Promise<MateriaDetalle>` que verifica existencia y elimina la relaciÃ³n (depende de T013, T023)

### Controller endpoints US2

- [x] T039 [US2] Agregar en `backend/src/controllers/plan.controller.ts` los endpoints `POST /carreras/:carreraId/plan/materias/:materiaId/correlativas` y `DELETE /carreras/:carreraId/plan/materias/:materiaId/correlativas` con sus `@ApiTags('Correlativas')`, `@ApiBody`, `@ApiResponse`, delegando a `CorrelativaService`; capturar `DomainError` â†’ 422, `NotFoundException` â†’ 404 (depende de T038)
- [x] T040 [US2] Crear DTO `AgregarCorrelativaDto { @IsUUID() correlativaId: string }` con `@ApiProperty` en `backend/src/controllers/dtos/agregar-correlativa.dto.ts`; registrar `CorrelativaService` en `PlanModule`

### Tests de integraciÃ³n US2

- [x] T041 [US2] Ampliar `backend/test/plan.e2e-spec.ts` con los escenarios de US2 (en el mismo archivo, misma instancia de container): (a) POST correlativa vÃ¡lida â†’ 200 + `correlativasCompletas: true`; (b) POST correlativa que no existe en el plan â†’ 422; (c) POST correlativa que crea ciclo â†’ 422; (d) POST materia como correlativa de sÃ­ misma â†’ 422; (e) DELETE correlativa existente â†’ 200 sin la correlativa; (f) DELETE correlativa inexistente â†’ 404

### Frontend US2

- [x] T042 [P] [US2] Ampliar `frontend/src/service/plan.ts` con `addCorrelativa(carreraId: string, materiaId: string, correlativaId: string): Promise<MateriaDetalle>` y `removeCorrelativa(carreraId: string, materiaId: string, correlativaId: string): Promise<MateriaDetalle>` (depende de T032)
- [x] T043 [P] [US2] Ampliar `frontend/src/hooks/usePlan.ts` con mÃ©todos `agregarCorrelativa` y `quitarCorrelativa` que llaman al service y actualizan la materia en el estado local del plan (depende de T042)
- [x] T044 [US2] Crear `frontend/src/components/CorrelativaForm.tsx`: formulario inline con un `<select>` que lista las otras materias del mismo plan como opciones (excluye la materia actual y sus correlativas ya registradas), botÃ³n "Agregar"; tambiÃ©n un botÃ³n "Ã—" por cada correlativa existente para quitarla; maneja loading y error inline; no hace HTTP directamente â€” recibe callbacks `onAdd` y `onRemove` del padre (depende de T031, T035)
- [x] T045 [US2] Integrar `CorrelativaForm` en `RevisionPlan.tsx`: pasarle los callbacks que llaman a `agregarCorrelativa`/`quitarCorrelativa` del hook; mostrar el formulario expandible por `MateriaCard` al hacer click en "Configurar correlativas" (depende de T043, T044)

**Checkpoint**: User Stories 1 y 2 completamente funcionales.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T046 [P] Verificar que el test de arquitectura en `backend/test/arch.spec.ts` sigue pasando con los nuevos mÃ³dulos: `PlanController` no importa repositorios directamente, `CorrelativaService` no importa entidades TypeORM directamente, `domain/` no importa nada de NestJS ni TypeORM
- [x] T047 [P] Verificar que `npm run lint` pasa en `backend/` con los nuevos archivos (oxlint)
- [x] T048 [P] Verificar que `npm run lint` pasa en `frontend/` con los nuevos archivos (ESLint 9)
- [x] T049 [P] Verificar que `npm run build` compila sin errores en `backend/` (`tsc -b`)
- [x] T050 [P] Verificar que `npm run build` compila sin errores en `frontend/` (`vite build`)
- [x] T051 Ejecutar los escenarios del [quickstart.md](quickstart.md) manualmente para validaciÃ³n end-to-end: levantar docker compose + backend + frontend, subir `plan-ejemplo.json`, verificar indicadores pendientes, agregar correlativa, verificar que desaparece el badge
- [x] T052 [P] Verificar que `npm run test` (tests unitarios de dominio) pasa en verde en `backend/`: `detectar-ciclos.spec.ts`, `parse-plan-file.spec.ts`, `build-plan.spec.ts`
- [x] T053 Verificar que `npm run test:e2e` pasa en verde en `backend/`: todos los escenarios de `plan.e2e-spec.ts` con Testcontainers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sin dependencias â€” comenzar de inmediato
- **Phase 2 (Foundational)**: depende de Phase 1 â€” bloquea US1 y US2
- **Phase 3 (US1)**: depende de Phase 2 completa
- **Phase 4 (US2)**: depende de Phase 2 completa; puede empezar en paralelo con US1 una vez Phase 2 lista, pero los tests e2e de US2 son mÃ¡s fÃ¡ciles con el plan ya cargado vÃ­a US1
- **Phase 5 (Polish)**: depende de US1 y US2 completas

### Within Each Story

- Dominio antes que servicio (T015 antes T024)
- Servicio antes que controller (T024 antes T027)
- Controller antes que tests e2e (T027 antes T030)
- Frontend puede empezar en paralelo con el backend una vez que el contrato OpenAPI es estable (desde T027 en adelante)

### Parallel Opportunities

- T008, T009 en paralelo (interfaces de dominio independientes)
- T017, T018 en paralelo (entities independientes)
- T022 en paralelo con T023 (repositories independientes)
- T031, T032, T033 del frontend en paralelo (service y types no dependen entre sÃ­)
- T035 en paralelo con T034 (componente y pÃ¡gina independientes)
- T046â€“T053 todos en paralelo salvo T051 y T053 (requieren entorno levantado)

---

## Parallel Example: Phase 2 Foundational

```
Batch A (en paralelo):
  T008  domain/carrera.ts
  T009  domain/materia.ts
  T017  entities/carrera.entity.ts
  T022  repositories/carrera.repository.ts

Batch B (en paralelo, tras T009):
  T010  domain/plan-de-estudios.ts
  T018  entities/plan-de-estudios.entity.ts

Batch C (secuencial):
  T011  domain/parse-plan-file.ts  â†’  T012 tests parse
  T013  domain/detectar-ciclos.ts  â†’  T014 tests ciclos  (en paralelo con T011/T012)
  T015  domain/build-plan-de-estudios.ts (tras T011 + T013)  â†’  T016 tests build
  T019  entities/materia.entity.ts (tras T018)
  T020  migration (tras T019)  â†’  T021 registrar en AppModule
  T023  repositories/plan.repository.ts (tras T019)
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational
3. Completar Phase 3: US1 (backend primero T024â€“T030, luego frontend T031â€“T037)
4. **Validar**: `npm test`, `npm run test:e2e`, quickstart escenarios 1â€“3
5. **Demostrable**: subir plan, ver materias con indicador de pendientes

### Incremental Delivery

1. Phase 1 + Phase 2 â†’ fundaciÃ³n lista
2. Phase 3 (US1) â†’ plan cargable y revisable (MVP)
3. Phase 4 (US2) â†’ correlativas editables manualmente
4. Phase 5 â†’ polish y validaciÃ³n final
