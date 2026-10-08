# Tasks: Andamiaje Inicial del Monorepo

**Input**: Design documents from `specs/001-monorepo-scaffold/`

**Organization**: Orden de implementación — Backend → Frontend → Docker Compose + CI.
Cada fase es un incremento validable de forma aislada antes de pasar a la siguiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias incompletas)
- **[Story]**: User story a la que pertenece la tarea ([US1], [US2], [US3])

---

## Phase 1: Setup (Infraestructura compartida)

**Purpose**: Crear el repositorio y las piezas que no pertenecen a ninguna carpeta específica.

- [x] T001 Crear `.nvmrc` en la raíz del repo con contenido `20` (Node 20 LTS)
- [x] T002 [P] Crear `.gitignore` en la raíz cubriendo `node_modules/`, `.env`, `dist/`, `coverage/`
- [x] T003 [P] Crear `.env.example` en la raíz con variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`; cada variable con un valor de ejemplo y un comentario en español

**Checkpoint**: Raíz del repo lista — archivos de entorno y Node documentados. ✅

---

## Phase 2: Foundational — Backend base (Bloqueante para US1)

**Purpose**: Backend NestJS compilable con estructura de capas, herramientas de calidad y
configuración de TypeORM. Debe completarse antes de agregar cualquier feature de dominio.

**⚠️ CRÍTICO**: Las fases de US1 y US2 no pueden comenzar hasta que esta fase esté completa.

> **Nota de implementación**: NestJS CLI instaló la versión 12 (no 11) con TypeScript 6, Vitest
> (no Jest) y oxlint (no ESLint). Se mantuvo el stack generado por ser más moderno y compatible.

- [x] T004 Inicializar proyecto NestJS en `backend/` — se usó `nest new backend --package-manager npm --strict --skip-git`; NestJS 12 generado (no 11); build y start funcionan
- [x] T005 Crear carpetas de capa vacías dentro de `backend/src/`: `controllers/`, `services/`, `domain/`, `repositories/`, `adapters/`, `migrations/`; `.gitkeep` en cada una
- [x] T006 [P] — oxlint ya incluido por NestJS 12; prettier incluido; no se instaló ESLint separado (oxlint es el linter del proyecto)
- [x] T007 [P] — oxlint configurado en `.oxlintrc.json` generado por NestJS
- [x] T008 [P] `backend/.prettierrc` creado por NestJS (configuración default)
- [x] T009 Scripts en `backend/package.json` alineados: `build`, `lint`, `test`, `test:e2e` presentes
- [x] T010 Instalar TypeORM: `@nestjs/typeorm typeorm pg @nestjs/config` instalados
- [x] T011 Instalar validación: `class-validator class-transformer` instalados
- [x] T012 Instalar Swagger: `@nestjs/swagger` instalado
- [x] T013 `backend/src/main.ts` reescrito: ValidationPipe global, Swagger en `/api/docs`, PORT desde env
- [x] T014 `backend/src/app.module.ts` reescrito: TypeOrmModule con synchronize:false, ConfigModule global
- [x] T015 [P] `backend/src/migrations/.gitkeep` creado
- [x] T016 `npm run build` en backend pasa sin errores ✅

**Checkpoint**: Backend compila y arranca. ✅

---

## Phase 3: User Story 1 — Desarrollador levanta el entorno completo (P1) 🎯 MVP

**Goal**: El backend responde en `/health`, Swagger está montado en `/api/docs`, y los tests
(arquitectura + humo e2e) pasan en verde.

**Independent Test**: `npm run build && npm test && npm run test:e2e` en `backend/` con Docker
corriendo — todos los tests pasan; `GET /health` devuelve `{"status":"ok"}`.

### Implementación US1

- [x] T017 [US1] `backend/src/controllers/health.controller.ts` creado con `@Get('health')` → `{status:'ok'}`, `@ApiTags` y `@ApiOkResponse`
- [x] T018 [US1] `HealthController` registrado en `backend/src/app.module.ts`
- [x] T019 [US1] `@testcontainers/postgresql@10 testcontainers@10` instalados (v10 para compatibilidad con Node 20)
- [x] T020 [US1] `tsarch` instalado (paquete `tsarch`, no `ts-arch`)
- [x] T021 [US1] `backend/test/arch.spec.ts` creado con 4 reglas tsarch (domain sin @nestjs, domain sin typeorm, controllers sin repositories, controllers sin adapters)
- [x] T022 [US1] — no aplica: se usa `vitest.config.e2e.ts` (Vitest, no Jest); `jest-e2e.json` no requerido
- [x] T023 [US1] `backend/test/health.e2e-spec.ts` creado con Testcontainers + supertest; `TESTCONTAINERS_RYUK_DISABLED=true` en `vitest.config.e2e.ts`
- [x] T024 [US1] `npm test` (5/5 ✅) y `npm run test:e2e` (1/1 ✅) pasan en verde

**Checkpoint US1**: Backend completamente validado. ✅

---

## Phase 4: User Story 2 — Desarrollador verifica el cumplimiento de capas (P2)

**Goal**: Las reglas tsarch cubren las dos direcciones prohibidas del Principio I.

**Independent Test**: Introducir temporalmente un `import { Injectable } from '@nestjs/common'`
en cualquier archivo de `backend/src/domain/` → `npm test` debe fallar; revertir → vuelve a
pasar.

### Implementación US2

- [x] T025 [US2] `backend/test/arch.spec.ts` ya incluye las 4 reglas (domain→nestjs, domain→typeorm, controllers→repositories, controllers→adapters) desde T021
- [x] T026 [US2] `npm test` pasa con todas las reglas tsarch activas ✅

**Checkpoint US2**: Red de seguridad de arquitectura completa. ✅

---

## Phase 5: User Story 3 — Frontend + CI (P3)

**Goal**: Frontend carga en el navegador sin errores, test de humo pasa, CI valida ambos
proyectos en verde.

### 5a — Frontend

- [x] T027 [US3] Estructura `frontend/` creada manualmente (sin red para `npm create vite`); `npm run build` ✅
- [x] T028 [US3] Carpetas de capa creadas: `service/`, `hooks/`, `contexts/`, `components/`, `pages/`, `types/`; `.gitkeep` en cada una
- [x] T029 [US3] Tailwind 4 + `@tailwindcss/vite` instalados; plugin configurado en `vite.config.ts`
- [x] T030 [US3] `frontend/src/index.css` con `@import "tailwindcss"` y bloque `@theme` con tokens pastel arcoíris
- [x] T031 [US3] `frontend/src/service/httpClient.ts` creado: lee `VITE_API_URL`, error descriptivo si no está definida
- [x] T032 [P] [US3] `frontend/.env.example` creado con `VITE_API_URL=http://localhost:3000`
- [x] T033 [P] [US3] ESLint 9 flat config (`eslint.config.js`) con typescript-eslint + eslint-config-prettier instalados
- [x] T034 [P] [US3] `frontend/eslint.config.js` creado con reglas TS + React + Prettier
- [x] T035 [P] [US3] `frontend/.prettierrc` creado con `{}`
- [x] T036 [US3] Scripts en `frontend/package.json`: `build`, `lint`, `test` presentes
- [x] T037 [US3] Vitest + React Testing Library + jest-dom + jsdom instalados
- [x] T038 [US3] Vitest configurado en `vite.config.ts`: `environment: 'jsdom'`, `globals: true`, `setupFiles`
- [x] T039 [US3] `frontend/src/setupTests.ts` creado con `import '@testing-library/jest-dom'`
- [x] T040 [US3] `frontend/src/__tests__/App.test.tsx` creado — smoke test del componente raíz
- [x] T041 [US3] `npm run build` ✅ y `npm test` (1/1 ✅) pasan en verde

### 5b — Docker Compose

- [x] T042 [US3] `docker-compose.yml` creado en raíz: postgres:16-alpine, variables de env, healthcheck, volumen pgdata
- [ ] T043 [US3] Verificar que `docker compose up -d` levanta el contenedor *(pendiente — verificar manualmente)*

### 5c — CI

- [x] T044 [US3] `.github/workflows/ci.yml` creado con jobs `backend` y `frontend`
- [ ] T045 [US3] Push al branch y verificar CI en verde *(pendiente — requiere push)*

**Checkpoint US3**: Frontend y docker-compose listos. CI pendiente de validación remota.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T046 [P] `README.md` actualizado con stack completo e instrucciones de inicio rápido
- [x] T047 [P] `.gitignore` cubre `.env`, `node_modules/`, `dist/`, `coverage/`
- [ ] T048 Ejecutar el flujo completo del `quickstart.md` desde cero *(validación final manual)*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sin dependencias — empieza de inmediato
- **Phase 2 (Foundational)**: Depende de Phase 1 — **bloquea US1 y US2**
- **Phase 3 (US1)**: Depende de Phase 2
- **Phase 4 (US2)**: Depende de Phase 3 (extiende `arch.spec.ts` creado en T021)
- **Phase 5 (US3)**: Depende de Phase 3 (frontend y CI son independientes del backend salvo el health endpoint)
- **Phase 6 (Polish)**: Depende de Phases 3–5

### User Story Dependencies

- **US1 (P1)**: Puede comenzar tras Phase 2
- **US2 (P2)**: Depende de T021 (arch.spec.ts creado en US1)
- **US3 (P3)**: Frontend es independiente del backend; CI depende de que ambos compilen

### Parallel Opportunities

- T001–T003 pueden correr en paralelo entre sí
- T006, T007, T008 pueden correr en paralelo (herramientas de calidad)
- T015, T019, T020 pueden correr en paralelo (instalaciones independientes)
- T032, T033, T034, T035 pueden correr en paralelo (setup frontend calidad)
- T027–T041 (frontend) pueden avanzar en paralelo con T042–T043 (docker-compose) una vez que Phase 2 esté completa

---

## Parallel Example: Phase 2

```text
# Correr en paralelo tras T004:
T005  Crear carpetas de capa
T006  Instalar ESLint/Prettier
T010  Instalar TypeORM
T011  Instalar class-validator
T012  Instalar Swagger

# Luego, secuencialmente:
T013  Reescribir main.ts  (depende de T012)
T014  Reescribir app.module.ts  (depende de T010)
```

---

## Implementation Strategy

### MVP (solo US1 — backend validado)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational backend
3. Completar Phase 3: US1 (health endpoint + tests)
4. **VALIDAR**: `npm test && npm run test:e2e` en verde → MVP del andamiaje de backend listo

### Entrega incremental completa

1. Setup + Foundational → backend compila
2. US1 → health + tests → backend MVP
3. US2 → reglas tsarch extendidas
4. US3 → frontend + docker-compose + CI → andamiaje completo
5. Polish → quickstart validado end-to-end
