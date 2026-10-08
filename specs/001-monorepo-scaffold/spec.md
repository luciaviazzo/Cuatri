# Feature Specification: Andamiaje Inicial del Monorepo

**Feature Branch**: `001-monorepo-scaffold`

**Created**: 2026-10-08

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Desarrollador levanta el entorno completo (Priority: P1)

Un desarrollador nuevo clona el repositorio, ejecuta un único comando para levantar la base de
datos y arranca backend y frontend de forma independiente. Ambos servicios responden sin errores
y el frontend puede comunicarse con el backend a través de la variable de entorno configurada.

**Why this priority**: Sin un entorno funcional no se puede escribir ninguna feature de dominio.
Este es el prerequisito absoluto del proyecto.

**Independent Test**: Se puede verificar abriendo `http://localhost:3000` (backend) y
`http://localhost:5173` (frontend) y confirmando que ambos responden; basta con esto para
demostrar que el andamiaje funciona.

**Acceptance Scenarios**:

1. **Given** el repositorio clonado y Docker en ejecución, **When** el desarrollador levanta la
   base de datos con Docker Compose, **Then** PostgreSQL 16 está disponible en el puerto 5432 con
   las credenciales del `.env`.
2. **Given** el backend instalado (`npm install` en `backend/`), **When** se inicia el servidor,
   **Then** el endpoint `GET /health` responde `200 OK` y la documentación Swagger está accesible
   en `/api/docs`.
3. **Given** el frontend instalado (`npm install` en `frontend/`), **When** se inicia el servidor
   de desarrollo, **Then** la página principal carga en el navegador sin errores de consola.
4. **Given** el frontend corriendo con `VITE_API_URL=http://localhost:3000`, **When** el cliente
   HTTP intenta alcanzar el backend, **Then** la URL base se resuelve correctamente desde la
   variable de entorno.

---

### User Story 2 — Desarrollador verifica el cumplimiento de capas (Priority: P2)

El desarrollador ejecuta la suite de tests del backend y el test de arquitectura confirma que
`domain/` no importa nada de NestJS ni de TypeORM, garantizando la separación de capas desde el
primer commit.

**Why this priority**: Si el test de arquitectura no existe desde el principio, el hábito de
violar capas se instala antes de que haya una red de seguridad.

**Independent Test**: Ejecutar `npm test` en `backend/` y observar que el test de arquitectura
pasa en verde; es un valor completo aunque no haya ninguna entidad de dominio real todavía.

**Acceptance Scenarios**:

1. **Given** el backend sin ninguna entidad de dominio, **When** se corre la suite de tests,
   **Then** el test de arquitectura pasa y confirma que `domain/` no tiene dependencias de
   `@nestjs/*` ni de `typeorm`.
2. **Given** una importación hipotética de `@nestjs/common` dentro de `domain/`, **When** se corre
   la suite, **Then** el test de arquitectura falla con un mensaje descriptivo.

---

### User Story 3 — CI valida backend y frontend en cada push (Priority: P3)

Cada push al repositorio dispara un workflow de CI que compila y testea backend y frontend de
forma independiente. El job del backend incluye un test de humo que levanta un Postgres efímero
y verifica que la aplicación arranca.

**Why this priority**: Sin CI, las garantías del andamiaje solo existen localmente y se rompen
silenciosamente.

**Independent Test**: Hacer un push y confirmar que el workflow de GitHub Actions finaliza en
verde; los dos jobs (backend y frontend) deben pasar.

**Acceptance Scenarios**:

1. **Given** un push con el código del andamiaje, **When** el workflow de CI se ejecuta, **Then**
   los jobs `backend` y `frontend` terminan en verde.
2. **Given** el job de backend, **When** se corre el test de humo (`health.e2e-spec.ts`), **Then**
   NestJS arranca contra un Postgres efímero de Testcontainers y responde correctamente.
3. **Given** el job de frontend, **When** se corre el test de humo del componente raíz, **Then**
   el test pasa con Vitest y React Testing Library.

---

### Edge Cases

- ¿Qué ocurre si el puerto 5432 ya está ocupado en la máquina local? El `.env.example` documenta
  cómo cambiar el puerto del Docker Compose sin modificar archivos versionados.
- ¿Qué ocurre si `VITE_API_URL` no está definida? El `httpClient.ts` lanza un error claro en
  tiempo de inicialización, no silenciosamente en tiempo de llamada.
- ¿Qué ocurre si TypeORM no puede conectarse a la base al arrancar el backend? La aplicación
  falla explícitamente con un mensaje de error que indica el problema de conexión.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El backend DEBE arrancar en el puerto 3000 y exponer `GET /health` que devuelva
  `200 OK`.
- **FR-002**: El backend DEBE exponer la documentación OpenAPI generada automáticamente en
  `GET /api/docs`.
- **FR-003**: El backend DEBE rechazar peticiones con cuerpos mal formados antes de llegar al
  handler (ValidationPipe global activo).
- **FR-004**: El backend DEBE conectarse a PostgreSQL mediante la configuración del `.env`, con
  `synchronize: false` y sin ninguna migración aplicada todavía.
- **FR-005**: El frontend DEBE arrancar en el puerto 5173 y mostrar una página de inicio sin
  errores de consola.
- **FR-006**: El frontend DEBE leer la URL base del backend desde la variable de entorno
  `VITE_API_URL`; si no está definida, DEBE fallar con un error descriptivo.
- **FR-007**: La suite de tests del backend DEBE incluir un test de arquitectura que falle si
  `domain/` importa `@nestjs/*` o `typeorm`.
- **FR-008**: La suite de tests del backend DEBE incluir un test de humo e2e que levante Postgres
  efímero con Testcontainers y verifique que el endpoint `/health` responde.
- **FR-009**: La suite de tests del frontend DEBE incluir un test de humo que renderice el
  componente raíz sin errores.
- **FR-010**: El workflow de CI DEBE ejecutar lint + build + test para backend y frontend en jobs
  independientes, con Docker disponible en el job de backend.
- **FR-011**: El repositorio DEBE incluir `.env.example` con todas las variables necesarias
  documentadas; el `.env` real NO DEBE estar versionado.

### Decisión de diseño documentada

**`synchronize: false` con migraciones vacías desde el arranque** (en lugar de dejar que TypeORM
sincronice el esquema automáticamente):

TypeORM en modo `synchronize: true` destruye y recrea columnas sin advertencia ante cualquier
cambio de entidad. Desarrollar con esa configuración durante la etapa de dominio inestable y
luego cambiarla requiere reaprender el flujo de cambios de esquema en producción, con el riesgo
de olvidar el cambio antes del primer deploy. Arrancar con `synchronize: false` y migraciones
vacías establece desde el primer commit que los cambios de esquema son explícitos, reversibles y
versionados — incluso cuando todavía no hay ninguna entidad real. El costo es cero: no hay
ninguna migración que correr.

### Key Entities

- **Monorepo**: Repositorio único con `backend/` y `frontend/` como proyectos independientes,
  cada uno con su propio `package.json` y lockfile.
- **Entorno de desarrollo**: Conjunto de variables en `.env` (no versionado) que configuran
  credenciales de base de datos y URL del backend; documentado en `.env.example`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un desarrollador que clona el repositorio por primera vez puede tener el entorno
  completo corriendo en menos de 10 minutos siguiendo únicamente el README.
- **SC-002**: El 100 % de los tests del andamiaje (arquitectura, humo backend, humo frontend)
  pasan en verde en la primera ejecución limpia.
- **SC-003**: El workflow de CI finaliza en verde en cada push al branch principal sin intervención
  manual.
- **SC-004**: El test de arquitectura detecta y rechaza cualquier importación de `@nestjs/*` o
  `typeorm` dentro de `domain/` en menos de 5 segundos.
- **SC-005**: La primera feature de dominio puede escribirse directamente sobre este andamiaje sin
  necesidad de cambiar ninguna configuración de proyecto.

## Assumptions

- El desarrollador tiene Node.js 20, Docker y Git instalados en su máquina local.
- No hay lógica de negocio, entidades, DTOs ni endpoints reales en esta spec; son fuera de alcance.
- La paleta de colores del frontend (tokens Tailwind) ya está definida en el canvas de diseño
  existente y se transcribe directamente a `src/index.css`; su contenido exacto no se especifica
  aquí.
- Los tokens de colores pastel arcoíris definidos en el canvas de diseño se usan como punto de
  partida; pueden ajustarse en iteraciones futuras sin afectar esta spec.
- `synchronize: false` implica que las migraciones vacías se crean pero no se aplican; la base de
  datos comienza sin ningún esquema de aplicación.
- El README de arranque rápido queda fuera del alcance de esta spec pero se asume necesario para
  cumplir SC-001.
