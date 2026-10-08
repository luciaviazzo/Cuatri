# Quickstart: Validación del Andamiaje

**Feature**: [spec.md](spec.md) | **Date**: 2026-10-08

Este documento describe cómo verificar que el andamiaje funciona de extremo a extremo.
No incluye código de implementación: para eso ver [tasks.md](tasks.md) (generado por
`/speckit-tasks`).

---

## Prerequisitos

- Node.js 20 LTS (`nvm use` en la raíz del repo carga el `.nvmrc` automáticamente)
- Docker en ejecución (para la base de datos y los tests e2e)
- Variables de entorno configuradas: copiar `.env.example` a `.env` en la raíz y en
  `frontend/` y ajustar si es necesario

---

## 1. Levantar la base de datos

```bash
docker compose up -d
```

**Resultado esperado**: El contenedor `db` aparece como `healthy` en `docker compose ps`.
PostgreSQL escucha en `localhost:5432`.

---

## 2. Instalar dependencias e iniciar el backend

```bash
cd backend
npm install
npm run build   # debe compilar sin errores
npm start       # o npm run start:dev para hot-reload
```

**Resultado esperado**:
- La consola muestra `Application is running on: http://localhost:3000`.
- `GET http://localhost:3000/health` devuelve `{"status":"ok"}` con código 200.
- `GET http://localhost:3000/api/docs` muestra la UI de Swagger (puede estar vacía de rutas
  reales; el endpoint `/health` debe aparecer).

---

## 3. Instalar dependencias e iniciar el frontend

```bash
cd frontend
npm install
npm run build   # debe compilar sin errores
npm run dev
```

**Resultado esperado**:
- La consola muestra `Local: http://localhost:5173`.
- Abrir `http://localhost:5173` en el navegador: la página carga sin errores en consola.

---

## 4. Ejecutar los tests del backend

```bash
cd backend
npm test          # tests unitarios + test de arquitectura (tsarch)
npm run test:e2e  # test de humo con Testcontainers (requiere Docker)
```

**Resultado esperado**:
- `npm test`: todos los tests pasan en verde, incluyendo el test de arquitectura que verifica
  que `domain/` no importa `@nestjs/*` ni `typeorm`.
- `npm run test:e2e`: NestJS arranca contra un Postgres efímero; `GET /health` responde 200.

---

## 5. Ejecutar los tests del frontend

```bash
cd frontend
npm test
```

**Resultado esperado**: El test de humo del componente raíz (`App.test.tsx`) pasa en verde.

---

## 6. Verificar el workflow de CI localmente (opcional)

Si se tiene [act](https://github.com/nektos/act) instalado:

```bash
act push --job backend
act push --job frontend
```

O simplemente hacer push al branch y verificar que el workflow de GitHub Actions finaliza en
verde en ambos jobs (`backend` y `frontend`).

---

## Criterios de éxito confirmados

| Criterio | Verificación |
|----------|-------------|
| SC-001: entorno levantado en < 10 min | Seguir los pasos 1–3 de este quickstart |
| SC-002: 100 % de tests en verde | Pasos 4 y 5 |
| SC-003: CI en verde | Paso 6 / push al branch |
| SC-004: tsarch detecta violaciones | Ver paso 4 — `npm test` |
| SC-005: primera feature puede escribirse sin cambios de config | La estructura de carpetas existe; TypeORM con `synchronize:false` y migraciones vacías listas |

---

## Troubleshooting rápido

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| Backend no conecta a DB | `.env` faltante o credenciales incorrectas | Copiar `.env.example` a `.env` y verificar |
| `VITE_API_URL` undefined | `.env` faltante en `frontend/` | Copiar `.env.example` a `frontend/.env` |
| Testcontainers falla | Docker no está corriendo | Iniciar Docker Desktop |
| tsarch falla con error de regla | Versión de tsarch incompatible | Verificar versión en `package.json` del backend |
