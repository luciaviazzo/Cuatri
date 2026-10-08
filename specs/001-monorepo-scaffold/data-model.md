# Data Model: Andamiaje Inicial del Monorepo

**Feature**: [spec.md](spec.md) | **Date**: 2026-10-08

## Nota

Esta feature no introduce entidades de negocio ni tablas de base de datos. Las únicas "entidades"
son los artefactos de configuración del entorno, documentados aquí como referencia.

---

## Entorno de desarrollo (configuración, no persistencia)

### Variables de entorno — Backend

Definidas en `.env` (no versionado); documentadas en `.env.example`.

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `DB_HOST` | string | Host de PostgreSQL | `localhost` |
| `DB_PORT` | number | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | string | Nombre de la base de datos | `cuatri_dev` |
| `DB_USER` | string | Usuario de PostgreSQL | `cuatri` |
| `DB_PASSWORD` | string | Contraseña de PostgreSQL | `cuatri_pass` |
| `PORT` | number | Puerto del servidor NestJS | `3000` |

### Variables de entorno — Frontend

Definidas en `.env` dentro de `frontend/` (no versionado); documentadas en `.env.example`.

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `VITE_API_URL` | string | URL base del backend | `http://localhost:3000` |

---

## Reglas de validación

- `DB_PORT` y `PORT` DEBEN ser enteros positivos.
- `VITE_API_URL` DEBE ser una URL válida con protocolo (`http://` o `https://`).
- Si `VITE_API_URL` no está definida al inicializar `httpClient.ts`, DEBE lanzarse un error
  descriptivo en tiempo de carga del módulo.

---

## Esquema de base de datos

Vacío en esta fase. TypeORM arranca con `synchronize: false` y sin ninguna entidad registrada.
Las migraciones vacías (`src/migrations/`) quedan como punto de partida para la primera feature
que introduzca una entidad real.

---

## Estado de transición

No hay estados de materia ni transiciones en esta feature (Principio III no aplica).
