# Implementation Plan: Andamiaje Inicial del Monorepo

**Branch**: `001-monorepo-scaffold` | **Date**: 2026-10-08 | **Spec**: [spec.md](spec.md)

## Summary

Crear el esqueleto completo del monorepo (backend NestJS 11 + frontend React 19 + Vite) con
estructura de capas, herramientas de calidad, tests de humo y CI listos para recibir la primera
feature de dominio. No hay lógica de negocio: el entregable es el andamiaje sobre el que todo
lo demás se construye.

Orden de implementación: backend → frontend → docker-compose.yml + CI.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict) sobre Node.js 20 LTS (`.nvmrc` en la raíz)

**Primary Dependencies**:
- Backend: NestJS 11, TypeORM, @nestjs/swagger, class-validator, class-transformer
- Frontend: React 19, Vite, Tailwind CSS 4
- Calidad: ESLint + @typescript-eslint + eslint-config-prettier, Prettier (default)
- Testing backend: Jest, supertest, Testcontainers, tsarch, fast-check
- Testing frontend: Vitest, React Testing Library

**Storage**: PostgreSQL 16 vía Docker Compose; TypeORM con `synchronize: false`

**Testing**: Jest (backend unit + e2e), Vitest (frontend); test de arquitectura con tsarch

**Target Platform**: Aplicación web responsiva; servidor Linux en CI (GitHub Actions)

**Project Type**: Web application — monorepo con backend (API REST) + frontend (SPA)

**Performance Goals**: No aplica en esta fase (andamiaje sin carga real)

**Constraints**: Sin deploy — el workflow de CI solo valida (lint + build + test)

**Scale/Scope**: Monorepo único; dos proyectos independientes, cada uno con su propio lockfile

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|-----------|--------|-------|
| I. Arquitectura en capas (backend) | ✅ | Carpetas `controllers/ services/ domain/ repositories/ adapters/` creadas desde el inicio; tsarch verifica desde el primer commit |
| II. Arquitectura por capas (frontend) | ✅ | Carpetas `service/ hooks/ contexts/ components/ pages/ types/` creadas desde el inicio |
| III. Estados de materia derivados | ✅ N/A | Sin entidades en esta fase |
| IV. Requisitos como reglas extensibles | ✅ N/A | Sin lógica de negocio en esta fase |
| V. Autenticación opcional | ✅ N/A | Sin endpoints en esta fase |
| VI. Validación en su nivel | ✅ | ValidationPipe global activo; sin handlers reales todavía |
| VII. Testing | ✅ | Test unitario de arquitectura (tsarch), test de humo e2e con Testcontainers, test de humo frontend con Vitest |
| VIII. Swagger desde decoradores | ✅ | Swagger montado en `/api/docs` desde `main.ts`; sin DTOs todavía |
| IX. Definición de terminado | ✅ | Tests en verde + app levanta + (sin endpoints nuevos, Swagger no aplica) |
| X. Idioma | ✅ | Identificadores en inglés, mensajes en español |
| XI. Spec-first | ✅ | Esta spec existe y está aprobada |

**Veredicto**: Sin violaciones. Proceder al diseño.

## Project Structure

### Documentation (this feature)

```text
specs/001-monorepo-scaffold/
├── plan.md              # Este archivo
├── research.md          # No aplica — sin incógnitas
├── data-model.md        # Entidades de configuración/entorno
├── quickstart.md        # Guía de validación del andamiaje
├── contracts/
│   └── health.yml       # Contrato del único endpoint: GET /health
└── tasks.md             # Fase 2 — /speckit-tasks
```

### Source Code (repository root)

```text
.nvmrc                        # Node 20 LTS (compartido por backend y frontend)
.env.example                  # Variables de entorno documentadas (no versionado: .env)
docker-compose.yml            # PostgreSQL 16, puerto 5432
.github/
└── workflows/
    └── ci.yml                # Jobs: backend (lint+build+test+test:e2e) y frontend (lint+build+test)

backend/
├── .eslintrc.js
├── .prettierrc
├── package.json              # scripts: build, lint, test, test:e2e
├── tsconfig.json             # strict: true (generado por nest new --strict)
├── src/
│   ├── main.ts               # Bootstrap, Swagger, ValidationPipe global
│   ├── app.module.ts         # TypeOrmModule con synchronize:false
│   ├── controllers/          # Capa Controller (vacía excepto health)
│   ├── services/             # Capa Service (vacía)
│   ├── domain/               # Capa Dominio (vacía)
│   ├── repositories/         # Capa Repository (vacía)
│   └── adapters/             # Capa Adapter (vacía)
└── test/
    ├── health.e2e-spec.ts    # Test de humo con Testcontainers
    └── arch.spec.ts          # Test de arquitectura (tsarch)

frontend/
├── .eslintrc.js
├── .prettierrc
├── package.json              # scripts: build, lint, test
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css             # Tailwind @theme con tokens de color pastel arcoíris
│   ├── service/
│   │   └── httpClient.ts     # Wrapper fetch; lee VITE_API_URL
│   ├── hooks/                # (vacío)
│   ├── contexts/             # (vacío)
│   ├── components/           # (vacío)
│   ├── pages/                # (vacío)
│   └── types/                # (vacío)
└── src/__tests__/
    └── App.test.tsx          # Test de humo: renderiza componente raíz
```

**Structure Decision**: Monorepo con dos proyectos independientes (Opción 2). Cada carpeta tiene
su propio `package.json` y lockfile; no hay workspace compartido. El `.nvmrc` y el
`docker-compose.yml` viven en la raíz del repositorio.

## Complexity Tracking

Sin violaciones a la constitución — tabla no aplica.
