# Feature Specification: Cargar la carrera (subir el plan y revisar las materias)

**Feature Branch**: `003-career-upload` (sin rama creada; no hay hook de git configurado)

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Pantalla para cargar la carrera: la persona estudiante sube el archivo de su plan de estudios (el reporte "Plan de estudios" de SIU Guaraní, en PDF o Excel .xls) y ve las materias que Cuatri detectó, para revisarlas. Es el primer paso de "Cargá tu carrera" del inicio. Reemplaza el aviso de "próximamente" del botón "+ Cargar mi primera carrera" del home, que ahora lleva a esta pantalla."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Subir el plan y ver las materias detectadas (Priority: P1)

La persona estudiante toca "+ Cargar mi primera carrera" en el inicio y llega a una pantalla que le
explica qué archivo subir. Elige el archivo de su plan, empieza el análisis, espera con un estado
claro y ve el resultado: un resumen de la carrera y el listado de materias agrupado por módulo,
con todo lo que el archivo trae y lo que no, dicho con honestidad.

**Why this priority**: Es el núcleo de la feature y el primer paso del producto ("Cargá tu
carrera"). Sin esto, Cuatri no tiene datos con los que trabajar ni la persona ningún motivo para
seguir.

**Independent Test**: Desde el inicio, tocar el botón, elegir el reporte de muestra (PDF y por
separado `.xls`), empezar el análisis y verificar que se ve el resumen y las 61 materias agrupadas,
con sus datos y con lo que falta marcado como "sin determinar".

**Acceptance Scenarios**:

1. **Given** el inicio, **When** la persona toca "+ Cargar mi primera carrera", **Then** llega a la
   pantalla de carga (ya no aparece el aviso de "próximamente").
2. **Given** la pantalla de carga, **When** la persona la mira, **Then** ve el título "Cargá tu
   carrera", una explicación corta de qué archivo subir y dónde conseguirlo (el PDF o Excel del plan
   de estudios que se descarga desde el sistema de la facultad), los formatos aceptados (PDF y Excel
   .xls) y el tamaño máximo (10 MB).
3. **Given** la pantalla de carga, **When** la persona toca "Elegir archivo" y selecciona un archivo,
   **Then** se muestran su nombre y su tamaño, y aparece el botón para empezar el análisis; antes de
   empezar puede elegir otro archivo y el anterior se reemplaza.
4. **Given** un archivo elegido, **When** la persona empieza el análisis, **Then** aparece un estado
   de carga claro que indica que se está procesando, y no puede iniciar un segundo análisis mientras
   dura.
5. **Given** un análisis exitoso, **When** termina, **Then** la persona ve un resumen con la carrera,
   el plan y la versión (si el archivo los trae), la cantidad de materias detectadas y cuántas
   figuran como aprobadas.
6. **Given** un análisis exitoso, **When** la persona mira el listado, **Then** las materias están
   agrupadas por módulo (por ejemplo "Ciclo Introductorio" o un núcleo de materias optativas) y cada
   una muestra su código, su nombre, sus créditos, si es optativa y, si el archivo lo trae, su
   estado: aprobada con su nota, o sin estado.
7. **Given** un archivo con módulos de otra propuesta (por ejemplo una diplomatura), **When** se
   muestra el resultado, **Then** esos módulos aparecen también, cada uno con su nombre.
8. **Given** un resultado, **When** la persona lo mira, **Then** el año del plan y las correlativas
   figuran como "sin determinar" (nunca como inexistentes ni con valores inventados) y una
   explicación breve indica que esos datos se podrán completar más adelante.
9. **Given** un resultado, **When** la persona lo mira, **Then** un aviso claro indica que es solo
   para revisar y todavía no se guarda: si sale o recarga, tiene que volver a subir el archivo.
10. **Given** un resultado, **When** la persona llega al final, **Then** encuentra las acciones
    "Cargar otro archivo" (vuelve a elegir un archivo desde cero) y "Volver al inicio".

---

### User Story 2 - Errores claros y forma de reintentar (Priority: P1)

Cuando algo sale mal, la persona entiende qué pasó y qué hacer. Cada causa tiene su propio mensaje
amable, y siempre puede volver a intentar con otro archivo (o reintentar el mismo si fue un problema
de conexión). Los problemas evidentes de formato y tamaño se avisan antes de enviar nada.

**Why this priority**: El archivo es un reporte real de la facultad y puede estar mal, vacío o ser
otro documento. Un error confuso o un botón que no responde es el momento en que alguien abandona.

**Independent Test**: Elegir un archivo de un formato no aceptado, uno demasiado grande, uno vacío,
un PDF sin materias y cortar la conexión durante el análisis, y verificar que cada caso muestra su
propio mensaje y permite reintentar.

**Acceptance Scenarios**:

1. **Given** un archivo de un formato que no es PDF ni Excel .xls o que supera 10 MB, **When** la
   persona lo elige, **Then** la pantalla se lo avisa antes de enviarlo, con la causa, y no inicia
   el análisis.
2. **Given** un análisis, **When** el servicio informa que el archivo no es un PDF ni un Excel
   válido, **Then** la persona ve un mensaje que lo explica y la opción de elegir otro archivo.
3. **Given** un análisis, **When** el servicio informa que el archivo está vacío, **Then** ve un
   mensaje propio de archivo vacío y la opción de elegir otro.
4. **Given** un análisis, **When** el servicio informa que el archivo supera el tamaño máximo,
   **Then** ve un mensaje propio de tamaño excedido y la opción de elegir otro.
5. **Given** un análisis, **When** el servicio informa que no encontró materias, **Then** ve un
   mensaje propio, que sugiere revisar que sea el reporte del plan de estudios, y la opción de
   elegir otro archivo.
6. **Given** un análisis, **When** no se puede conectar con el servicio (sin conexión o servicio no
   disponible), **Then** ve un mensaje propio y la opción de reintentar con el mismo archivo o de
   elegir otro.
7. **Given** un análisis que tarda más de lo normal, **When** pasan 10 segundos, **Then** se le
   avisa amablemente que puede demorar un poco más, sin que parezca trabado; si pasan 60 segundos se
   trata como servicio no disponible.

---

### User Story 3 - Arrastrar el archivo como comodidad (Priority: P2)

En computadora, la persona puede arrastrar el archivo sobre el área de carga en vez de tocar el
botón. Es una comodidad adicional: todo lo que se puede hacer arrastrando se puede hacer también con
el botón "Elegir archivo" y con teclado.

**Why this priority**: Agiliza la carga en computadora, pero la feature funciona igual sin ella;
por eso es secundaria.

**Independent Test**: Arrastrar un archivo válido, uno inválido y varios a la vez sobre el área, y
verificar que el resultado es el mismo que eligiéndolos con el botón.

**Acceptance Scenarios**:

1. **Given** la pantalla de carga, **When** la persona arrastra un archivo sobre el área, **Then**
   el área indica visualmente que puede soltarse y, al soltarlo, se comporta igual que al elegirlo
   con el botón (nombre, tamaño y botón para analizar).
2. **Given** el área de carga, **When** la persona suelta un archivo de un formato no aceptado o
   demasiado grande, **Then** recibe el mismo aviso previo que con el botón.
3. **Given** el área de carga, **When** la persona suelta varios archivos, **Then** se le avisa que
   se analiza un archivo a la vez y puede elegir cuál usar.
4. **Given** una persona que usa solo teclado o lector de pantalla, **When** recorre la pantalla,
   **Then** llega al botón "Elegir archivo" y puede hacer todo sin arrastrar.

---

### User Story 4 - Pantalla accesible, privada y legible aun con muchas materias (Priority: P2)

La pantalla se usa bien en celular y en computadora, se recorre con teclado, cumple los contrastes
de accesibilidad, lee con claridad un listado de 60 materias o más, y nunca muestra los datos
personales que trae el reporte.

**Why this priority**: Es un requisito de calidad y de confianza que aplica a toda la pantalla; el
reporte real contiene nombre y legajo de la persona.

**Independent Test**: Revisar la pantalla de 320 a 1920 px con el reporte de muestra (61 materias),
recorrerla con teclado, medir contrastes y buscar el nombre y el legajo de la persona en pantalla.

**Acceptance Scenarios**:

1. **Given** el reporte real de muestra, **When** se muestra el resultado, **Then** el nombre y el
   legajo de la persona no aparecen en ningún lugar de la pantalla.
2. **Given** un resultado de 60 materias o más, **When** se lo mira en un celular de 360 px, **Then**
   el listado se lee sin desplazamiento horizontal y cada materia se distingue claramente.
3. **Given** el uso solo con teclado, **When** la persona recorre la pantalla, **Then** alcanza y
   activa todas las acciones en orden lógico, con foco visible.
4. **Given** un lector de pantalla, **When** cambia el estado (cargando, resultado o error), **Then**
   el lector lo anuncia sin que la persona tenga que buscarlo.

---

### Edge Cases

- La persona elige un archivo, cambia de idea y elige otro antes de empezar: el último reemplaza al
  anterior.
- La persona cancela el selector de archivos sin elegir nada: la pantalla queda como estaba.
- Arrastra algo que no es un archivo (por ejemplo texto) o suelta fuera del área: no pasa nada ni
  se rompe.
- El servicio estaba dormido y la primera respuesta tarda mucho: se muestra el aviso de demora (10
  s) y, pasados 60 s, el error de servicio no disponible con la opción de reintentar.
- La persona pierde la conexión a mitad del análisis: ve el error de conexión y puede reintentar.
- Una materia sin créditos o sin código: el dato se muestra como "sin dato", no vacío ni inventado.
- Una materia sin módulo: se agrupa bajo "Sin módulo".
- Una misma materia que aparece en más de un lugar: se muestra una sola vez (el servicio ya la
  deduplica).
- La persona recarga la página o vuelve atrás con un resultado en pantalla: el resultado se pierde y
  empieza de nuevo; no queda nada guardado.
- La persona toca "Analizar" varias veces seguidas: se inicia un solo análisis.
- Pantalla muy angosta (320 px) o zoom 200 %: todo sigue legible y alcanzable, sin desplazamiento
  horizontal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El botón "+ Cargar mi primera carrera" del inicio MUST llevar a esta pantalla en vez
  de mostrar el aviso de "próximamente".
- **FR-002**: La pantalla MUST mostrar el título "Cargá tu carrera", una explicación corta de qué
  archivo subir y dónde conseguirlo, los formatos aceptados (PDF y Excel .xls) y el tamaño máximo
  (10 MB).
- **FR-003**: La pantalla MUST permitir elegir el archivo con un botón "Elegir archivo" o
  arrastrándolo sobre el área de carga, de a un archivo por vez.
- **FR-004**: La pantalla MUST mostrar el nombre y el tamaño del archivo elegido y un botón para
  empezar el análisis, y MUST permitir cambiar de archivo antes de empezar.
- **FR-005**: La pantalla MUST avisar, antes de enviar nada, cuando el archivo elegido no es de un
  formato aceptado o supera el tamaño máximo, indicando la causa y sin iniciar el análisis.
- **FR-006**: Durante el análisis la pantalla MUST mostrar un estado de carga claro y MUST impedir
  iniciar un segundo análisis a la vez.
- **FR-007**: Si el análisis tarda más de 10 segundos, la pantalla MUST avisar amablemente que puede
  demorar más de lo normal; pasados 60 segundos MUST tratarlo como servicio no disponible.
- **FR-008**: Ante un análisis exitoso, la pantalla MUST mostrar un resumen con la carrera, el plan
  y la versión (cuando el archivo los trae), la cantidad de materias detectadas y cuántas figuran
  como aprobadas.
- **FR-009**: La pantalla MUST mostrar el listado de materias agrupado por módulo; cada materia con
  su código, su nombre, sus créditos, si es optativa y, si el archivo lo trae, su estado (aprobada
  con su nota, o sin estado).
- **FR-010**: La pantalla MUST mostrar todos los módulos del resultado, incluidos los de otras
  propuestas (por ejemplo una diplomatura), cada uno con su nombre, y MUST agrupar bajo "Sin
  módulo" las materias que no lo tengan.
- **FR-011**: La pantalla MUST mostrar el año del plan y las correlativas como "sin determinar" y
  MUST NOT mostrarlos como inexistentes ni con valores inventados; MUST incluir una explicación
  breve de que se podrán completar más adelante. Un dato ausente de una materia (créditos, código)
  MUST mostrarse como "sin dato".
- **FR-012**: La pantalla MUST indicar con claridad que el resultado es solo para revisar y todavía
  no se guarda.
- **FR-013**: La pantalla MUST ofrecer, junto al resultado, las acciones "Cargar otro archivo"
  (vuelve a elegir un archivo desde cero) y "Volver al inicio".
- **FR-014**: Ante un error, la pantalla MUST mostrar un mensaje amable y distinto para cada causa:
  archivo que no es PDF ni Excel válido, archivo vacío, archivo que supera el tamaño máximo,
  ninguna materia encontrada, y servicio no disponible o sin conexión.
- **FR-015**: Ante cualquier error, la pantalla MUST ofrecer elegir otro archivo y, en el caso de
  servicio no disponible o sin conexión, MUST ofrecer además reintentar con el mismo archivo.
- **FR-016**: La pantalla MUST NOT mostrar el nombre, el legajo ni otros datos personales de la
  persona que figuren en el reporte.
- **FR-017**: La pantalla MUST NOT guardar el archivo ni el resultado: al salir o recargar, se
  pierden y hay que volver a subir el archivo.
- **FR-018**: La pantalla MUST ser usable sin cuenta ni sesión.
- **FR-019**: La pantalla MUST ser responsiva: legible y sin desplazamiento horizontal desde 320 px
  hasta 1920 px de ancho, y el listado de 60 materias o más MUST leerse con claridad en celular.
- **FR-020**: Todas las acciones MUST poder hacerse con teclado, en orden lógico y con foco
  visible; arrastrar el archivo MUST ser una comodidad adicional, nunca la única forma.
- **FR-021**: Los cambios de estado (cargando, resultado, error) MUST ser anunciados por los
  lectores de pantalla, y el foco MUST pasar al resultado o al mensaje de error cuando aparecen.
- **FR-022**: Todo texto MUST cumplir el contraste AA, usar solo los colores y las tipografías de
  la guía de estilo de Cuatri y estar en español rioplatense (con voseo).

### Key Entities *(include if feature involves data)*

- **Archivo elegido**: El archivo que la persona selecciona o arrastra: nombre, tamaño y formato.
  Vive solo mientras la pantalla está abierta.
- **Resultado de revisión**: Lo que devuelve el análisis: datos del plan (carrera, plan, versión) y
  las materias detectadas, agrupadas por módulo. No se guarda.
- **Materia detectada**: Código, nombre, créditos, si es optativa, módulo y estado (aprobada con
  nota, o sin estado); el año del plan y las correlativas figuran siempre como "sin determinar".
- **Error de carga**: La causa (formato inválido, vacío, demasiado grande, sin materias, servicio no
  disponible) y su mensaje para la persona.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona pasa de tocar "+ Cargar mi primera carrera" a ver su resultado en menos de
  1 minuto, sin contar la espera del análisis y sin ayuda.
- **SC-002**: El 100 % de las materias que devuelve el análisis aparecen en pantalla, y la cantidad
  mostrada en el resumen coincide con las del listado.
- **SC-003**: Cada una de las 5 causas de error muestra su propio mensaje y ofrece cómo continuar,
  en el 100 % de los casos probados.
- **SC-004**: El 100 % de los datos que el archivo no trae (año del plan, correlativas) se muestran
  como "sin determinar", y ninguno aparece vacío, como inexistente o inventado.
- **SC-005**: El nombre y el legajo del reporte de muestra no aparecen en la pantalla en ninguna
  de las pruebas (0 apariciones).
- **SC-006**: No hay desplazamiento horizontal de 320 a 1920 px, ni con zoom de texto al 200 %, con
  un resultado de 60 materias o más.
- **SC-007**: El 100 % de los pares de color cumple el contraste AA y el 100 % de las acciones se
  puede hacer solo con teclado.
- **SC-008**: Aunque la persona toque "Analizar" varias veces seguidas, se inicia un solo análisis
  (0 envíos duplicados).
- **SC-009**: Al menos 4 de cada 5 personas de prueba, después de ver el resultado, saben que todavía
  no se guardó.

## Assumptions

- Usa el servicio de extracción de planes ya existente (feature 001): acepta PDF y Excel .xls de
  hasta 10 MB, devuelve las materias para revisar sin guardarlas y distingue las causas de error
  indicadas; esta pantalla solo lo presenta.
- Al estar en producción el servicio en un plan gratuito, puede estar "dormido" y tardar cerca de un
  minuto en la primera respuesta; por eso el aviso de demora a los 10 segundos y el límite de 60
  segundos.
- El control previo de formato y tamaño es una ayuda rápida (por tipo y tamaño del archivo); el
  servicio es quien decide si el contenido es válido.
- Esta pantalla es el paso 1 del inicio ("Cargá tu carrera"). Al publicarse reemplaza el aviso de
  "próximamente" del botón principal del inicio (feature 002).
- El archivo y el resultado viven solo en la pantalla mientras está abierta; nada se guarda ni se
  conserva en el dispositivo.
- Se reutiliza la guía de estilo y el estilo visual del inicio; solo modo claro.
- "Volver al inicio" lleva a la pantalla de inicio.
- Fuera de alcance: guardar la carrera, corregir o completar los datos del resultado, confirmar el
  plan, marcar materias aprobadas, filtrar módulos de otras propuestas, generar opciones de cursada,
  el plan de ejemplo y cuentas o sesión.
