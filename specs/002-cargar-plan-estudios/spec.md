# Feature Specification: Carga y Configuración del Plan de Estudios

**Feature Branch**: `002-cargar-plan-estudios`

**Created**: 2026-10-08

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Carga inicial del plan de estudios (Priority: P1)

Un usuario sube un archivo estructurado con las materias de su carrera agrupadas por año. El
sistema procesa el archivo, crea el plan de estudios completo con todas sus materias y deriva
automáticamente las correlativas que el archivo incluya. Las materias sin correlativas detectadas
quedan marcadas para configuración manual.

**Why this priority**: Sin el plan de estudios no hay base sobre la que operar ninguna otra
feature. Es el punto de entrada de todo el dominio de Cuatri.

**Independent Test**: Puede verificarse cargando un archivo válido y confirmando que las materias
aparecen listadas con sus años y sus correlativas derivadas; las materias sin correlativas muestran
el indicador de configuración pendiente.

**Acceptance Scenarios**:

1. **Given** un archivo válido con materias agrupadas por año y algunas con correlativas,
   **When** el usuario lo sube, **Then** el sistema crea el plan con todas las materias, asigna
   las correlativas derivadas del archivo, y marca con "pendiente de configuración" las que
   quedaron sin correlativas.
2. **Given** una carrera que ya tiene un plan cargado, **When** el usuario sube un nuevo archivo,
   **Then** el plan anterior se reemplaza completamente por el nuevo.
3. **Given** un archivo vacío o sin materias, **When** el usuario intenta cargarlo, **Then** el
   sistema lo rechaza con un mensaje que explica el motivo; no se modifica el plan existente.
4. **Given** un archivo con una materia sin año asignado, **When** el usuario intenta cargarlo,
   **Then** el sistema rechaza el plan completo e indica qué materia tiene el problema.
5. **Given** un archivo con una correlativa que referencia una materia inexistente en el plan,
   **When** el usuario intenta cargarlo, **Then** el sistema rechaza el plan completo e indica
   la inconsistencia encontrada.
6. **Given** un archivo con una correlativa circular (A requiere B que requiere A), **When** el
   usuario intenta cargarlo, **Then** el sistema rechaza el plan completo e indica el ciclo
   detectado.

---

### User Story 2 — Configuración manual de correlativas (Priority: P2)

El usuario puede agregar o quitar correlativas de una materia en cualquier momento posterior a
la carga inicial, no solo durante el procesamiento del archivo.

**Why this priority**: El archivo de plan muchas veces está incompleto o desactualizado. La
configuración manual es el mecanismo de corrección que hace usable el plan en la práctica.

**Independent Test**: Con el plan ya cargado, agregar una correlativa a una materia que no la
tenía, verificar que aparece reflejada; luego quitarla y verificar que desaparece.

**Acceptance Scenarios**:

1. **Given** una materia con correlativas incompletas, **When** el usuario agrega una correlativa
   válida, **Then** la correlativa queda registrada y la materia ya no aparece marcada como
   pendiente de configuración (si tenía ese indicador).
2. **Given** una materia con correlativas, **When** el usuario quita una, **Then** la correlativa
   se elimina sin afectar las demás materias del plan.
3. **Given** que el usuario intenta agregar como correlativa una materia que no existe en el plan,
   **Then** el sistema lo rechaza con un mensaje claro.
4. **Given** que agregar la correlativa crearía un ciclo (A requiere B que ya requiere A),
   **Then** el sistema lo rechaza indicando el ciclo que se formaría.

---

### Edge Cases

- ¿Qué ocurre si el archivo tiene dos materias con el mismo nombre en el mismo plan? Se rechaza
  el plan completo: los nombres de materia dentro de un plan deben ser únicos.
- ¿Qué ocurre si el usuario intenta agregar una materia como correlativa de sí misma? Se rechaza
  como ciclo directo.
- ¿Qué ocurre si se reemplaza un plan y algunas materias del historial académico del usuario
  referenciaban materias del plan anterior? Queda fuera del alcance de esta feature (el historial
  académico es la Feature 2); se asume que el reemplazo puede dejar referencias huérfanas, lo
  cual se maneja en la integración con Feature 2.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE aceptar la carga de un archivo estructurado que liste materias
  agrupadas por año, con nombre y correlativas opcionales por materia.
- **FR-002**: Al procesar el archivo, el sistema DEBE crear el plan de estudios de la carrera con
  todas las materias y sus correlativas derivadas.
- **FR-003**: Las materias sin correlativas detectadas en el archivo DEBEN quedar marcadas como
  pendientes de configuración manual; no se asume que no tienen correlativas.
- **FR-004**: El sistema DEBE rechazar el plan completo (sin carga parcial) ante cualquiera de
  estos casos: archivo vacío o sin materias, materia sin año asignado, correlativa que referencia
  una materia inexistente en el plan, correlativa circular.
- **FR-005**: Cada rechazo DEBE acompañarse de un mensaje que identifique el motivo y, cuando
  sea posible, la materia o el par de materias involucrados.
- **FR-006**: Cargar un nuevo plan para una carrera que ya tiene uno DEBE reemplazar el plan
  anterior de forma completa.
- **FR-007**: El plan de estudios DEBE pertenecer a una carrera identificada, aunque hoy solo
  exista una carrera en el sistema.
- **FR-008**: El usuario DEBE poder agregar una correlativa a una materia existente en cualquier
  momento.
- **FR-009**: El usuario DEBE poder quitar una correlativa de una materia existente en cualquier
  momento.
- **FR-010**: Agregar una correlativa DEBE rechazarse si la materia referenciada no existe en el
  plan o si genera un ciclo de dependencias.
- **FR-011**: La pantalla de revisión DEBE mostrar el listado de materias con sus correlativas
  derivadas y el indicador de configuración pendiente donde corresponda.

### Decisión de diseño documentada

**El modelo de plan de estudios lleva carrera desde esta feature** (aunque multi-carrera sea
Feature 6): se paga el costo de modelado ahora para evitar una migración de esquema posterior.
Una carrera puede tener cero o un plan activo; un plan pertenece a exactamente una carrera.

**Riesgo aceptado fuera de alcance**: no hay versionado de planes. Reemplazar un plan descarta
el anterior sin dejar rastro. Si una carrera cambia su plan con alumnos cursando bajo el plan
viejo, las referencias al plan anterior pueden quedar inconsistentes — esto se trata como deuda
técnica aceptada hasta que el negocio lo requiera.

### Key Entities

- **Carrera**: unidad académica a la que pertenece un plan de estudios. Identificada por nombre
  o código. Puede tener cero o un plan activo.
- **Plan de estudios**: conjunto de materias de una carrera, organizado por año. Pertenece a
  exactamente una carrera.
- **Materia**: unidad curricular con nombre, año en el plan, estado de configuración de
  correlativas (completa / pendiente), y cero o más correlativas.
- **Correlativa**: relación entre dos materias del mismo plan que expresa que una debe estar
  aprobada para habilitar la otra.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede cargar un plan de estudios completo y ver todas sus materias con
  sus correlativas en menos de 30 segundos desde que sube el archivo.
- **SC-002**: El 100 % de los rechazos por archivo inválido incluyen un mensaje que identifica
  el motivo sin requerir que el usuario inspeccione el archivo manualmente.
- **SC-003**: Un usuario puede agregar o quitar una correlativa de cualquier materia en menos de
  3 interacciones desde la pantalla de revisión.
- **SC-004**: Ninguna carga parcial llega a persistirse ante un archivo con errores — o todo el
  plan se carga, o nada.
- **SC-005**: El plan de una carrera puede reemplazarse por uno nuevo sin pérdida de datos de
  otras carreras (aislamiento por carrera).

## Assumptions

- El formato del archivo de entrada es JSON o YAML estructurado (no un PDF ni un Excel); el
  formato exacto se define en la fase de diseño.
- Hoy existe una sola carrera en el sistema (UNQ); el modelo ya distingue la carrera como
  entidad, pero la pantalla de selección de carrera no forma parte del alcance de esta feature.
- La pantalla de revisión de correlativas es de solo lectura excepto por la edición manual de
  correlativas; no incluye edición de nombres de materias ni de años.
- El panel completo de la carrera (con estados aprobada/en curso/habilitada por materia) no es
  parte de esta feature — depende del historial académico (Feature 2).
- Los nombres de materias dentro de un plan son únicos; el sistema rechaza duplicados.
- No hay autenticación requerida para esta feature (Principio V de la constitución).
