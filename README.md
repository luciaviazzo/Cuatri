# Cuatri — Planificador de Cursada Multi-Carrera

Plataforma de planificación académica multi-carrera (UNQ como primera carrera cargada).
Permite cargar un plan de estudios, marcar materias aprobadas o en curso, y visualizar qué
materias están habilitadas según los requisitos — sin necesidad de crear una cuenta.

---

## Stack

### Backend

| Herramienta | Versión | Rol |
|-------------|---------|-----|
| Node.js | 20 LTS | Runtime |
| NestJS | 11 | Framework HTTP |
| TypeScript | 5.7 (strict) | Lenguaje |
| TypeORM | latest | Acceso a base de datos |
| PostgreSQL | 16 | Base de datos relacional |
| @nestjs/swagger | latest | Documentación OpenAPI 3 (generada desde decoradores) |
| class-validator / class-transformer | latest | Validación de DTOs |

### Frontend

| Herramienta | Versión | Rol |
|-------------|---------|-----|
| React | 19 | UI |
| Vite | latest | Bundler / dev server |
| TypeScript | 5.7 (strict) | Lenguaje |
| Tailwind CSS | 4 | Estilos |

### Infraestructura

| Herramienta | Rol |
|-------------|-----|
| Docker Compose | PostgreSQL local de desarrollo |
| GitHub Actions | CI (lint + build + test) |

### Testing

| Herramienta | Alcance |
|-------------|---------|
| Jest + supertest | Tests unitarios y e2e del backend |
| Testcontainers | PostgreSQL efímero en tests de integración / e2e |
| tsarch | Test de arquitectura (verifica reglas de capas) |
| fast-check | Property-based testing para invariantes de dominio |
| Vitest + React Testing Library | Tests del frontend |

### Calidad de código

| Herramienta | Configuración |
|-------------|---------------|
| ESLint + @typescript-eslint | Modo recomendado; configuración separada por carpeta |
| eslint-config-prettier | Evita conflictos entre ESLint y Prettier |
| Prettier | Configuración default; archivo por carpeta |

---

## Estructura del repositorio

```text
.
├── .nvmrc                  # Node 20 LTS
├── .env.example            # Variables de entorno (copiar a .env, no versionar)
├── docker-compose.yml      # PostgreSQL 16 en puerto 5432
├── backend/                # API REST — NestJS
│   └── src/
│       ├── controllers/    # Capa Controller
│       ├── services/       # Capa Service
│       ├── domain/         # Lógica de negocio (sin dependencias de framework)
│       ├── repositories/   # Capa Repository (dominio ↔ persistencia)
│       ├── adapters/       # Capa Adapter (integraciones externas)
│       ├── main.ts
│       └── app.module.ts
└── frontend/               # SPA — React + Vite
    └── src/
        ├── service/        # Acceso a red (única capa que llama a fetch)
        ├── hooks/          # Hooks que invocan a service/
        ├── contexts/       # Estado compartido entre componentes lejanos
        ├── components/     # Componentes reutilizables
        ├── pages/          # Vistas de nivel de ruta
        └── types/          # Tipos e interfaces TypeScript
```

---

## Inicio rápido

### 1. Requisitos previos

- Node.js 20 LTS (`nvm use` carga la versión desde `.nvmrc`)
- Docker en ejecución

### 2. Variables de entorno

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env   # ajustar VITE_API_URL si es necesario
```

### 3. Base de datos

```bash
docker compose up -d
```

### 4. Backend

```bash
cd backend
npm install
npm run start:dev   # http://localhost:3000
                    # Swagger: http://localhost:3000/api/docs
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev         # http://localhost:5173
```

---

## Scripts

Ambas carpetas exponen los mismos nombres de script:

| Script | Descripción |
|--------|-------------|
| `npm run build` | Compila el proyecto |
| `npm run lint` | Ejecuta ESLint |
| `npm test` | Tests unitarios (+ test de arquitectura en el backend) |
| `npm run test:e2e` | Tests e2e con Testcontainers *(solo backend)* |

---

## CI

GitHub Actions (`.github/workflows/ci.yml`) corre dos jobs independientes — `backend` y
`frontend` — ejecutando `lint → build → test` (y `test:e2e` en el job de backend).
El job de backend requiere Docker para Testcontainers. No hay deploy: el workflow solo valida.

---

## Principios de arquitectura

Ver [`.specify/memory/constitution.md`](.specify/memory/constitution.md) para la constitución
completa del proyecto.

En resumen:

- **Backend**: capas con dependencias en un único sentido —
  `Controller → Service → {Dominio, Repository, Adapter}`.
- **Frontend**: organizado por capa, nunca por feature.
- **Dominio**: sin decoradores de NestJS ni TypeORM; lógica de negocio pura.
- **Estados de materia**: solo `aprobada` y `en curso` se persisten; `habilitada` se calcula.
- **Autenticación**: completamente opcional — toda la funcionalidad core funciona sin login.
- **Tests**: unitarios sin base de datos, e2e con Testcontainers, property-based con fast-check.
