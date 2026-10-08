<!--
SYNC IMPACT REPORT (remove before committing)
=============================================
Version change:  (new) → 1.0.0
Bump rationale:  Initial constitution — first-time population from blank template.

Added sections:
  - Core Principles: I through XI (all new)
  - Technology Stack & Constraints (new)
  - Governance (new)

Modified principles:    none (initial)
Removed sections:       none (initial)

Deferred TODOs:         none — all placeholders resolved.
=============================================
-->

# Cuatri — Planificador de Cursada Multi-Carrera Constitution

## Core Principles

### I. Arquitectura en capas (backend)

El backend se organiza en capas con dependencias en un único sentido:
`Controller → Service → {Dominio, Repository, Adapter}`.

- El **Controller** DEBE hablar únicamente con el Service. No llama a un Repository ni a un Adapter
  directamente, y no contiene lógica de negocio. Los DTOs viven en esta capa y se convierten a
  objetos de dominio antes de delegar.
- El **Service** DEBE orquestar entre dominio, Repositories y Adapters. No contiene cálculos de
  negocio propios. Recibe y devuelve objetos de dominio, nunca entidades de persistencia.
- El **Dominio** es donde vive la lógica de negocio. NO lleva decoradores de TypeORM ni conoce
  NestJS, HTTP ni la base de datos.
- El **Repository** es el único punto donde conviven dominio y persistencia. Recibe y devuelve
  objetos de dominio; por dentro usa la entidad de persistencia con un mapper explícito y sin lógica
  de negocio.
- El **Adapter** es la única puerta de entrada a cualquier sistema o librería externa. El Service
  NO importa esas dependencias directamente.
- Si un Adapter externo falla, el sistema DEBE seguir funcionando con los datos persistidos
  localmente; solo la funcionalidad que depende de ese Adapter puede quedar indisponible.

### II. Arquitectura por capas (frontend)

El frontend se organiza por **capa** dentro de `frontend/src/`, nunca por feature.

- `service/` es la única capa que accede a la red, con un módulo por recurso.
- `hooks/` y `contexts/` son las únicas capas que invocan a `service/`. `contexts/` se usa solo si
  la feature necesita estado compartido entre componentes lejanos en el árbol.
- `components/` reúne todo lo componentizable y NO contiene llamadas HTTP propias.
- `pages/` son las vistas de nivel de ruta.
- `types/` agrupa los tipos e interfaces TypeScript, separados del resto.
- Un componente NUNCA llama a `fetch` ni a un cliente de API directamente: solo a través de un
  hook o de `service/`.

### III. Estados de materia derivados

Una materia persiste únicamente **dos** estados posibles: `aprobada` (con nota opcional) y
`en curso`. Los estados `habilitada` y `no habilitada` NO se persisten: se calculan evaluando
si se cumplen los requisitos de la materia contra el conjunto de materias aprobadas.

Una equivalencia se modela como una `aprobada` con un origen distinto (`equivalencia`), no como
un quinto estado, y cuenta en el promedio solo si tiene nota asociada.

### IV. Requisitos como reglas extensibles

Los requisitos para habilitar una materia se modelan como objetos de regla con una interfaz común,
no como un campo fijo en la materia. Una materia puede tener cero, una o varias reglas combinadas.
Añadir un nuevo tipo de requisito DEBE lograrse implementando la interfaz existente, sin modificar
la estructura de la materia.

### V. Autenticación opcional para sincronización

Cuatri es completamente usable **sin** crear una cuenta: toda funcionalidad core (cargar plan,
marcar materias, cargar oferta, generar cursada, preferencias) funciona con datos guardados
localmente, sin login.

- Ningún endpoint, salvo el de autenticación o sincronización, DEBE exigir estar logueado.
- Un usuario puede, opcionalmente, crear una cuenta para acceder a sus datos desde otro dispositivo.
- La carrera es la frontera de pertenencia de los datos, no la cuenta: una carrera puede existir y
  usarse plenamente sin estar vinculada a ninguna cuenta.

### VI. Cada validación en su nivel

Cada tipo de validación DEBE ocurrir en su nivel correspondiente:

- El **DTO** valida forma y tipos.
- El **Service** valida que lo pedido exista y la acción sea posible.
- El **Dominio** valida sus propias invariantes de negocio, lanzando excepciones propias.

Un único exception filter global centraliza el manejo de errores con un formato de error JSON
consistente. El sistema NO filtra stack traces al cliente en producción.

### VII. Testing

- Los tests unitarios de dominio se ejecutan **sin** NestJS y **sin** base de datos.
- Los tests de integración y end-to-end corren contra PostgreSQL real y efímero levantado con
  Testcontainers, nunca contra una base persistente, ni en local ni en CI.
- Toda función de dominio que encapsule una invariante combinatoria o algorítmica DEBE testearse
  también con property-based testing (fast-check), no solo con casos de ejemplo.
- Existe un test de arquitectura (tsarch) que verifica las reglas de capas de los Principios I y II
  y DEBE hacer fallar el build si se violan.
- Todo comportamiento DEBE cubrirse con casos felices y casos borde.
- Ningún test existente se modifica ni se borra para hacerlo pasar sin pedir permiso explícito.

### VIII. Documentación de la API

La API DEBE documentarse con OpenAPI v3 vía `@nestjs/swagger`, generada desde los DTOs y
decoradores. Queda prohibido escribir o editar la documentación de la API a mano.

### IX. Definición de terminado

Un requerimiento se considera terminado cuando:

1. Los tests de backend y de frontend (cuando aplica) pasan en verde.
2. La aplicación compila y levanta con la configuración local.
3. Si agrega o modifica un endpoint, la documentación Swagger queda actualizada.

### X. Idioma

- Los **identificadores de código** están en inglés.
- Los **nombres de dominio conceptual**, mensajes de error y documentación están en español.
- Los **términos técnicos** sin traducción natural se mantienen en inglés.

### XI. Spec-first

Cada feature DEBE nacer de una spec antes de escribir código. Toda ambigüedad se resuelve como
una decisión explícita en la spec, con su justificación. Queda prohibido iniciar implementación
sin spec aprobada.

## Technology Stack & Constraints

- **Backend**: Node.js 20, NestJS 11, TypeScript 5.7 en modo strict.
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS 4 — aplicación web responsiva.
- **Persistencia**: PostgreSQL accedida vía TypeORM; base local levantada con Docker Compose.
- **Autenticación**: Opcional, vía JWT y bcrypt, exclusivamente para el flujo de sincronización
  entre dispositivos; ningún otro endpoint depende de ella.
- **Testing backend**: Jest, supertest, Testcontainers, tsarch, fast-check.
- **Testing frontend**: Vitest con React Testing Library.
- **CI**: GitHub Actions contra la base efímera de Testcontainers; SonarCloud para análisis
  estático.
- **Estructura**: Monorepo único con `backend/` y `frontend/`, organización interna por capa en
  ambos.

## Governance

Esta constitución es el documento de mayor autoridad del proyecto. Toda práctica, decisión técnica
o convención que la contradiga DEBE adecuarse a ella, no al revés.

**Enmiendas**:
- Cualquier cambio a los principios DEBE documentarse en esta constitución con la justificación
  correspondiente y el bump de versión semántica apropiado.
- MAJOR: eliminación o redefinición incompatible de un principio.
- MINOR: nuevo principio, sección o ampliación material de guía existente.
- PATCH: clarificaciones, redacción, correcciones tipográficas.

**Cumplimiento**:
- Toda PR DEBE verificar el cumplimiento de los Principios I y II mediante el test de arquitectura
  (tsarch) antes de mergearse.
- El revisor DEBE rechazar código que viole cualquier principio de esta constitución.
- La constitución es el punto de partida de toda spec: las specs son las que la implementan.

**Version**: 1.0.0 | **Ratified**: 2026-10-08 | **Last Amended**: 2026-10-08
