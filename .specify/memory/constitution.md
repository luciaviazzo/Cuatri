<!--
Sync Impact Report (temporal, para revisión humana; eliminar antes de commitear)
- Version change: 1.0.0 → 1.0.1 (PATCH)
- Motivo: el proyecto dejó de usar SonarCloud; se quita de las Restricciones de Stack (CI). Los
  principios no cambian y ninguno exigía SonarCloud.
- Principios modificados: ninguno
- Secciones agregadas / eliminadas: ninguna
- Plantillas dependientes: no se modificaron (leen la constitución en runtime)
- TODOs diferidos: ninguno
- Valores asumidos en 1.0.0 (no provistos por el usuario): reglas de enmienda, versionado y
  revisión de la sección Gobernanza.
-->
# Cuatri — Planificador de Cursada Multi-Carrera Constitution

## Core Principles

### I. Arquitectura en capas (backend)
El backend se organiza en capas con dependencias en un único sentido:
Controller → Service → {Dominio, Repository, Adapter}.

- El Controller (router de FastAPI) DEBE hablar únicamente con el Service. No llama a un
  Repository ni a un Adapter directamente y no contiene lógica de negocio. Los schemas de
  Pydantic viven en esta capa y se convierten a objetos de dominio antes de delegar.
- El Service DEBE orquestar entre dominio, Repositories y Adapters. No contiene cálculos de
  negocio propios. Recibe y devuelve objetos de dominio, nunca entidades de persistencia.
- El Dominio es donde vive la lógica de negocio. NO lleva decoradores de SQLAlchemy ni conoce
  FastAPI, HTTP ni la base de datos.
- El Repository es el único punto donde conviven dominio y persistencia. Recibe y devuelve
  objetos de dominio; por dentro usa el modelo de SQLAlchemy con un mapper explícito y sin
  lógica de negocio.
- El Adapter es la única puerta de entrada a cualquier sistema o librería externa. El Service
  NO importa esas dependencias directamente.
- Si un Adapter externo falla, el sistema DEBE seguir funcionando con los datos persistidos
  localmente; solo la funcionalidad que depende de ese Adapter puede quedar indisponible.

### II. Arquitectura por capas (frontend)
El frontend se organiza por capa dentro de `frontend/src/`, nunca por feature.

- `service/` es la única capa que accede a la red, con un módulo por recurso.
- `hooks/` y `contexts/` son las únicas capas que invocan a `service/`. `contexts/` se usa solo
  si la feature necesita estado compartido entre componentes lejanos en el árbol.
- `components/` reúne todo lo componentizable y NO contiene llamadas HTTP propias.
- `pages/` son las vistas de nivel de ruta.
- `types/` agrupa los tipos e interfaces TypeScript, separados del resto.
- Un componente NUNCA llama a `fetch` ni a un cliente de API directamente: solo a través de un
  hook o de `service/`.

### III. Estados de materia derivados
Una materia persiste únicamente dos estados posibles: aprobada (con nota opcional) y en curso.
Los estados habilitada y no habilitada NO se persisten: se calculan evaluando si se cumplen los
requisitos de la materia contra el conjunto de materias aprobadas.

Una equivalencia se modela como una aprobada con un origen distinto (equivalencia), no como un
quinto estado.

### IV. Requisitos como reglas extensibles
Los requisitos para habilitar una materia se modelan como objetos de regla con una interfaz
común, no como un campo fijo en la materia. Una materia puede tener cero, una o varias reglas
combinadas. Añadir un nuevo tipo de requisito DEBE lograrse implementando la interfaz
existente, sin modificar la estructura de la materia.

### V. Autenticación opcional para sincronización
Cuatri es completamente usable sin crear una cuenta: toda funcionalidad core (cargar plan,
marcar materias, cargar oferta, generar cursada, preferencias) funciona con datos guardados
localmente, sin login.

- Ningún endpoint, salvo el de autenticación o sincronización, DEBE exigir estar logueado.
- Un usuario puede, opcionalmente, crear una cuenta para acceder a sus datos desde otro
  dispositivo.
- La carrera es la frontera de pertenencia de los datos, no la cuenta: una carrera puede existir
  y usarse plenamente sin estar vinculada a ninguna cuenta.

### VI. Cada validación en su nivel
Cada tipo de validación DEBE ocurrir en su nivel correspondiente:

- El schema de Pydantic valida forma y tipos.
- El Service valida que lo pedido exista y la acción sea posible.
- El Dominio valida sus propias invariantes de negocio, lanzando excepciones propias.

Un único exception handler global (`@app.exception_handler`) centraliza el manejo de errores
con un formato de error JSON consistente. El sistema NO filtra stack traces al cliente en
producción.

### VII. Testing
- Los tests unitarios de dominio se ejecutan sin FastAPI y sin base de datos.
- Los tests de integración y end-to-end corren contra PostgreSQL real y efímero levantado con
  Testcontainers (testcontainers-python), nunca contra una base persistente, ni en local ni
  en CI.
- Toda función de dominio que encapsule una invariante combinatoria o algorítmica DEBE
  testearse también con property-based testing (Hypothesis), no solo con casos de ejemplo.
- Existe un test de arquitectura (import-linter, con contratos que prohíben imports entre capas
  no permitidos) que verifica las reglas de capas de los Principios I y II y DEBE hacer fallar
  el build si se violan.
- Todo comportamiento DEBE cubrirse con casos felices y casos borde.
- Ningún test existente se modifica ni se borra para hacerlo pasar sin pedir permiso explícito.

### VIII. Documentación de la API
La API DEBE documentarse con OpenAPI v3, generada automáticamente por FastAPI a partir de los
schemas de Pydantic y las firmas de los endpoints. Queda prohibido escribir o editar la
documentación de la API a mano.

### IX. Definición de terminado
Un requerimiento se considera terminado cuando:

- Los tests de backend y de frontend (cuando aplica) pasan en verde.
- La aplicación compila (o, en Python, pasa el type-check de mypy) y levanta con la
  configuración local.
- Si agrega o modifica un endpoint, la documentación OpenAPI queda actualizada (generación
  automática verificada).
- El proyecto permanece deployable en el entorno público configurado (no alcanza con que
  funcione en local): cada feature que agrega o modifica un endpoint o pantalla DEBE
  verificarse también contra el deploy real antes de considerarse terminada.

### X. Idioma
Los identificadores de código están en inglés. Los nombres de dominio conceptual, mensajes de
error y documentación están en español. Los términos técnicos sin traducción natural se
mantienen en inglés.

### XI. Spec-first
Cada feature DEBE nacer de una spec antes de escribir código. Toda ambigüedad se resuelve como
una decisión explícita en la spec, con su justificación. Queda prohibido iniciar implementación
sin spec aprobada.

## Restricciones de Stack Tecnológico

- Backend: Python 3.12, FastAPI, Pydantic v2, mypy en modo strict.
- Frontend: React 19, Vite, TypeScript, Tailwind CSS 4 — aplicación web responsiva.
- Persistencia: PostgreSQL accedida vía SQLAlchemy 2.0 + Alembic para migraciones; base local
  levantada con Docker Compose.
- Autenticación: opcional, vía JWT (PyJWT) y bcrypt (passlib), exclusivamente para el flujo de
  sincronización entre dispositivos; ningún otro endpoint depende de ella.
- Testing backend: pytest, httpx (TestClient de FastAPI), testcontainers-python, import-linter,
  Hypothesis.
- Testing frontend: Vitest con React Testing Library.
- CI: GitHub Actions contra la base efímera de Testcontainers.
- Estructura: monorepo único con `backend/` y `frontend/`, organización interna por capa en
  ambos.

## Flujo de Desarrollo y Calidad

- Todo cambio sigue el flujo spec-first del Principio XI: spec aprobada → plan → tareas →
  implementación.
- Un cambio no se considera terminado hasta cumplir la Definición de terminado (Principio IX).
- El CI DEBE ejecutar mypy, pytest, import-linter y Vitest, y fallar ante cualquier violación.
- Los commits y pushes los ejecuta el usuario; al terminar una implementación se entrega el
  nombre de commit sugerido, en español.

## Governance

Esta constitución prevalece sobre cualquier otra práctica o convención del proyecto.

- **Enmiendas**: se proponen por escrito, con justificación, y requieren aprobación explícita
  del dueño del proyecto. Toda enmienda actualiza la versión y la fecha de última enmienda, y
  debe incluir un plan de migración si afecta código existente.
- **Versionado** (semántico): MAJOR para remociones o redefiniciones incompatibles de
  principios; MINOR para nuevos principios o secciones, o guía materialmente ampliada; PATCH
  para aclaraciones y correcciones de redacción.
- **Cumplimiento**: toda spec, plan y revisión DEBE verificar el cumplimiento de estos
  principios; los desvíos DEBEN justificarse explícitamente en la spec o el plan.

**Version**: 1.0.1 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-21
