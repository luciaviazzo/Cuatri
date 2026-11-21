# Feature Specification: Extracción de materias desde el plan de estudios (PDF o Excel)

**Feature Branch**: `001-pdf-plan-extraction` (sin rama creada; no hay hook de git configurado)

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Un estudiante que recién armó o actualizó su carrera en Cuatri necesita cargar su plan de estudios sin transcribirlo materia por materia a mano. El único plan que puede obtener de la facultad (UNQ, vía SIU Guaraní) es un PDF con el listado oficial de materias; esta feature permite subir ese PDF y que el sistema extraiga automáticamente las materias que contiene. El plan también se puede subir como archivo Excel (.xls)." Actualización 2026-11-20: tras analizar archivos reales de muestra (un PDF y un .xls del reporte "Plan de estudios" de SIU Guaraní), el spec se ajustó a su estructura real (ver Clarifications).

## Clarifications

### Session 2026-11-20

- Q: Cuando la columna de correlativas incluye un requisito que no es el nombre de otra materia (por ejemplo "tener aprobado el CBC" o "80 créditos aprobados"), ¿qué debe hacer el sistema? → A: Devolverlo como texto literal, marcado como requisito no interpretado, junto con las correlativas que sí son materias.
- Q: Cuando el plan trae un estado por materia que no es ni "aprobada" ni "en curso", ¿qué debe devolver el sistema? → A: Solo aprobada (con nota) o en curso cuando el archivo lo indica con claridad; cualquier otro estado se devuelve como texto literal no interpretado.
- Q: Si el plan lista materias optativas o electivas, ¿cómo deben aparecer en el resultado? → A: Cada una con nombre propio se devuelve como una materia más, marcada como optativa.
- Q: Cuando se rechaza un archivo, ¿el mensaje indica la causa o es un aviso único? → A: Mensaje distinto por causa: formato no soportado o archivo inválido (ni PDF ni Excel válido), archivo vacío, no se encontraron materias y tamaño excedido.
- Q: ¿Los nombres de materias y de correlativas se devuelven exactamente como figuran o normalizados? → A: Tal como figuran, quitando solo espacios sobrantes y saltos de línea partidos; sin cambiar mayúsculas ni tildes.
- Q: ¿Qué formatos de archivo se pueden subir? → A: PDF y Excel (.xls). Con cualquiera de los dos se aplican las mismas reglas de extracción y de rechazo.

### Session 2026-11-20 (hallazgos de los archivos reales de muestra)

- Hallazgo: el archivo real es el reporte "Plan de estudios" del alumno de SIU Guaraní: una tabla (Actividad, Tipo, Año, Período, Nota, Origen, Créditos, Puntaje) agrupada por módulos y bloques "Materia genérica", con el historial del alumno. Ambos formatos tienen el mismo contenido (61 materias, 24 aprobadas).
- Decisión: el año del plan y las correlativas NO figuran en este formato; quedan "sin asignar" y "sin determinar". Las columnas Año y Período (vacías en la muestra) se devuelven tal cual si traen valor, sin interpretarlas como año del plan.
- Decisión: además de nombre, año y correlativas, se extraen el código de la materia, los créditos, el origen, el tipo de actividad y el módulo al que pertenece.
- Decisión: las materias dentro de un bloque "Materia genérica" se marcan como optativas; se devuelven todos los módulos del archivo (incluidas las de otras propuestas, por ejemplo una diplomatura), cada una etiquetada con su módulo.
- Decisión: una nota con formato "9 (Promocionado)" se reconoce como aprobada con nota 9; una materia sin nota queda sin estado (no es "pendiente" ni "en curso").
- Decisión: el reporte contiene datos personales del alumno (nombre, legajo). Esos datos NO se devuelven, no se registran y el contenido del archivo no se envía a servicios de terceros.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Subir el plan (PDF o Excel) y obtener las materias detectadas (Priority: P1)

El estudiante sube su plan de estudios, como PDF o como Excel (.xls). El sistema interpreta el
contenido y devuelve un resultado de revisión con los datos de la carrera y una entrada por cada
materia detectada: nombre, código, créditos, módulo, si es optativa y, cuando el archivo lo trae,
su estado (nota y origen).

**Why this priority**: Es el núcleo de la feature y su único valor directo: evitar que el
estudiante transcriba el plan a mano. Sin esto no hay feature.

**Independent Test**: Subir el reporte de muestra (PDF y, por separado, .xls) y verificar que el
resultado lista las 61 materias con sus campos y que ambos formatos dan el mismo resultado.

**Acceptance Scenarios**:

1. **Given** el reporte "Plan de estudios" en PDF con materias agrupadas por módulos, **When** el
   estudiante lo sube, **Then** el resultado contiene cada materia con su nombre, código, créditos
   y módulo.
2. **Given** una materia con nota "9 (Promocionado)" y origen "Promoción", **When** se extrae,
   **Then** queda como aprobada con nota 9 y origen "Promoción".
3. **Given** una materia sin nota ni origen, **When** se extrae, **Then** queda sin estado: no se
   marca como pendiente, desaprobada ni en curso.
4. **Given** materias listadas dentro de un bloque "Materia genérica", **When** se extrae,
   **Then** quedan marcadas como optativas y conservan el nombre de su bloque como módulo.
5. **Given** un archivo con varios módulos, incluido uno de otra propuesta (por ejemplo una
   diplomatura), **When** se extrae, **Then** se devuelven las materias de todos los módulos, cada
   una con su módulo, y una materia de un módulo que continúa en la página siguiente conserva su
   módulo.
6. **Given** el mismo plan subido una vez como PDF y otra como Excel (.xls), **When** se extrae,
   **Then** las materias del resultado son las mismas en ambos casos.
7. **Given** un Excel con el plan repartido en más de una hoja, **When** se sube, **Then** el
   resultado reúne las materias de todas las hojas como un único plan, sin duplicados.
8. **Given** un archivo que trae carrera, plan y versión en el encabezado, **When** se extrae,
   **Then** el resultado los incluye, pero no incluye el nombre ni el legajo del alumno.
9. **Given** un archivo válido, **When** se completa la extracción, **Then** nada queda guardado de
   forma permanente: el resultado es solo para revisión.

---

### User Story 2 - Distinguir "no sé" de "confirmado que no hay" (Priority: P1)

Cuando el archivo no trae un dato, el resultado no lo inventa. El año del plan queda sin asignar
(el reporte de SIU no lo informa). Si el archivo no menciona correlativas para una materia, quedan
"sin determinar", lo cual es distinto de "confirmado que no tiene correlativas", que solo se indica
cuando el archivo lo dice explícitamente.

**Why this priority**: Una feature posterior permitirá completar a mano lo que falte; para eso el
sistema debe poder diferenciar un dato desconocido de uno confirmado como inexistente. Si se
pierde esta distinción, el dato queda incorrecto de forma irrecuperable.

**Independent Test**: Con el reporte de muestra (sin año del plan ni correlativas) y con un archivo
que sí trae una columna de correlativas, verificar que cada caso queda marcado de forma distinta.

**Acceptance Scenarios**:

1. **Given** el reporte de SIU, que no trae correlativas, **When** se extrae, **Then** todas las
   materias quedan con correlativas "sin determinar", no con "sin correlativas".
2. **Given** un archivo con una columna de correlativas donde una materia indica explícitamente que
   no tiene, **When** se extrae, **Then** esa materia queda como "confirmado sin correlativas".
3. **Given** un archivo con una columna de correlativas con valores, **When** se extrae, **Then**
   cada materia devuelve sus correlativas; un requisito que no es el nombre de una materia (por
   ejemplo "CBC aprobado") se devuelve como texto literal no interpretado.
4. **Given** un archivo cuyas columnas Año y Período están vacías, **When** se extrae, **Then** no
   se deduce ningún año del plan, ni del módulo ni de otro dato, y el año queda sin asignar.
5. **Given** un archivo con datos faltantes en algunas materias, **When** se extrae, **Then** el
   resultado se considera válido y exitoso (resultado parcial), no un error.

---

### User Story 3 - Rechazo claro de archivos no procesables (Priority: P2)

Si el archivo no es un PDF ni un Excel (.xls) válido, está vacío, supera el tamaño máximo o no se
puede extraer ninguna materia de su contenido, el sistema rechaza la operación e informa al
estudiante la causa.

**Why this priority**: Evita que el estudiante crea que cargó su plan cuando en realidad el
resultado está vacío o es parcial sin aviso. Es secundario porque solo cubre el camino de error.

**Independent Test**: Subir un archivo de formato no soportado, uno vacío, uno demasiado grande, un
PDF sin materias y un Excel sin materias, y verificar que en todos los casos hay un rechazo con
mensaje claro y ningún resultado.

**Acceptance Scenarios**:

1. **Given** un archivo que no es un PDF ni un Excel (.xls) válido (por ejemplo, una imagen con
   extensión .pdf o .xls, o un documento de otro formato), **When** se sube, **Then** el sistema
   rechaza la operación indicando que el formato no es soportado o el archivo no es válido.
2. **Given** un archivo vacío, **When** se sube, **Then** el sistema rechaza la operación
   indicando que el archivo está vacío.
3. **Given** un PDF o un Excel válido del que no se puede extraer ninguna materia, **When** se
   sube, **Then** el sistema rechaza la operación indicando que no encontró materias, en vez de
   devolver un resultado vacío.
4. **Given** un archivo que supera el tamaño máximo permitido, **When** se sube, **Then** el
   sistema rechaza la operación indicando que el tamaño fue excedido.

---

### Edge Cases

- Reporte con otro diseño (por ejemplo de otra universidad): si no se reconoce ninguna tabla de
  materias se rechaza; si se reconocen algunas, se devuelve el resultado parcial.
- PDF o Excel protegido con contraseña o corrupto: se trata como un archivo no procesable.
- Archivo cuya extensión no coincide con su contenido real (por ejemplo, una imagen llamada
  `plan.xls`): se identifica por su contenido y se rechaza como formato no soportado o inválido.
- PDF escaneado como imagen, sin texto seleccionable: se rechaza si no se extrae ninguna materia.
- Encabezados de tabla repetidos en cada módulo o página, títulos, pies de página y leyendas
  (por ejemplo las notas `(*)`, `(-)`, `(!)` sobre optativas compartidas): no son materias y se
  ignoran.
- Módulo cuyo título está en una página y cuyas materias siguen en la siguiente: las materias
  conservan ese módulo.
- Nota que no es "número (Promocionado)" (por ejemplo "2 (Desaprobado)", un número suelto o un
  texto): se devuelve como estado literal no interpretado, sin convertirlo a aprobada.
- Créditos, origen o código ausentes o ilegibles: ese dato queda sin asignar; la materia se
  devuelve igual.
- Materia repetida (mismo código, o mismo nombre si no hay código): no se duplica; se conserva la
  primera aparición.
- Excel con filas vacías, celdas combinadas o títulos sobre la tabla: se extraen las materias
  ignorando lo que no sea una materia.
- Excel con hojas sin materias (portada, notas, hojas vacías): se ignoran; si ninguna hoja aporta
  materias, se rechaza.
- Excel con fórmulas, macros o contenido activo: solo se leen los valores visibles de las celdas;
  nunca se ejecuta nada del archivo.
- Archivo de un tamaño excesivo: se rechaza informando que se excedió el tamaño.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir al estudiante subir un archivo de plan de estudios en
  formato PDF o Excel (.xls) sin necesidad de tener una cuenta.
- **FR-002**: El sistema MUST identificar el formato del archivo por su contenido real y no por su
  extensión, y MUST aplicar las mismas reglas de extracción y de rechazo a un PDF que a un Excel.
- **FR-003**: El sistema MUST devolver, para cada materia, su nombre tal como figura, quitando solo
  espacios sobrantes y saltos de línea partidos, sin cambiar mayúsculas ni tildes, y su código
  cuando figura al final del nombre entre paréntesis; el código no forma parte del nombre. El mismo
  criterio de limpieza MUST aplicarse a los nombres de correlativas.
- **FR-004**: El sistema MUST devolver los créditos y el tipo de actividad de cada materia cuando
  figuran.
- **FR-005**: El sistema MUST devolver el módulo (el título del bloque donde figura) de cada
  materia y MUST marcar como optativas las materias listadas dentro de un bloque "Materia
  genérica".
- **FR-006**: El sistema MUST devolver las materias de todos los módulos del archivo, incluidas las
  de otras propuestas, cada una con su módulo, y MUST mantener el módulo de una materia cuando su
  tabla continúa en otra página.
- **FR-007**: El sistema MUST dejar la materia sin estado cuando no tiene nota. Si la nota es
  numérica con una condición de aprobación entre paréntesis (por ejemplo "9 (Promocionado)"), MUST
  devolverla como aprobada con esa nota y esa condición; si el archivo indica "en curso", MUST
  devolverla como en curso. Cualquier otra nota o estado MUST devolverse como texto literal marcado
  como estado no interpretado, sin convertirlo a aprobada ni en curso.
- **FR-008**: El sistema MUST devolver el origen de la materia como texto literal cuando figura, y
  MUST devolver el contenido de las columnas Año y Período, cuando tienen valor, como datos de
  cursada informados por el archivo, sin interpretarlos.
- **FR-009**: El sistema MUST dejar el año del plan sin asignar cuando el archivo no lo informa
  explícitamente, y MUST NOT deducirlo del módulo, de las columnas Año o Período ni de ningún otro
  dato.
- **FR-010**: El sistema MUST devolver, cuando el archivo incluye correlativas, las de cada materia
  en uno de tres estados distinguibles: lista de requisitos detectados, "confirmado sin
  correlativas" (solo si el archivo lo dice explícitamente) y "sin determinar" (cuando no hay
  mención). MUST NOT tratar la ausencia de mención como "confirmado sin correlativas".
- **FR-011**: Cuando la columna de correlativas contiene un requisito que no es el nombre de una
  materia, el sistema MUST devolverlo como texto literal marcado como requisito no interpretado,
  junto con las correlativas que sí son materias, y MUST NOT descartarlo ni interpretarlo.
- **FR-012**: El sistema MUST considerar un resultado con datos faltantes (año del plan,
  correlativas, créditos, origen o estado) un resultado parcial válido, no un error.
- **FR-013**: El sistema MUST devolver la carrera, el plan y la versión cuando figuran en el
  encabezado, y MUST dejar sin asignar el que no se reconozca.
- **FR-014**: El sistema MUST NOT devolver, registrar ni conservar el nombre, el legajo ni otros
  datos personales del alumno presentes en el archivo, y MUST NOT enviar el contenido del archivo a
  servicios de terceros.
- **FR-015**: El sistema MUST rechazar la operación e informar la causa cuando el archivo no es un
  PDF ni un Excel (.xls) válido, está vacío, supera el tamaño máximo o no se extrae ninguna materia.
- **FR-016**: Los mensajes de rechazo MUST estar en español, MUST NOT exponer detalles técnicos
  internos y MUST indicar la causa: formato no soportado o archivo inválido, archivo vacío, ninguna
  materia encontrada o tamaño excedido.
- **FR-017**: El sistema MUST NOT devolver un resultado vacío ni parcial sin avisar cuando
  corresponde rechazar la operación.
- **FR-018**: El sistema MUST devolver el resultado como un resultado de revisión y MUST NOT
  persistirlo.
- **FR-019**: El sistema MUST NOT validar durante la extracción que las correlativas detectadas
  existan entre las materias extraídas.
- **FR-020**: Cuando un Excel tiene varias hojas, el sistema MUST considerar las materias de todas
  las hojas como un único plan e ignorar las hojas sin materias.
- **FR-021**: Al leer un Excel, el sistema MUST usar solo los valores visibles de las celdas y MUST
  NOT ejecutar fórmulas, macros ni ningún otro contenido activo del archivo.
- **FR-022**: El sistema MUST NOT duplicar una materia repetida en el archivo, identificándola por
  su código (o por su nombre si no tiene código) y conservando su primera aparición.

### Key Entities *(include if feature involves data)*

- **Resultado de extracción**: Datos del plan (carrera, plan, versión) y conjunto de materias
  detectadas en un PDF o Excel, entregado para revisión y no guardado.
- **Materia extraída**: Código, nombre, tipo de actividad, créditos, módulo, indicador de si es
  optativa, año del plan (sin asignar en el formato de SIU), año y período informados por el
  archivo, origen, correlativas y estado.
- **Correlativas extraídas**: Cada materia tiene una de tres situaciones: una lista de requisitos
  detectados, "confirmado sin correlativas" o "sin determinar". La lista puede combinar nombres de
  materias requeridas y requisitos no interpretados (texto literal que no es una materia).
- **Estado extraído**: Aprobada (con nota y condición), en curso, o texto literal no interpretado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un estudiante obtiene el listado de materias de su plan en menos de 5 segundos desde
  que sube un archivo de hasta 20 páginas (PDF) o de volumen equivalente (Excel).
- **SC-002**: Sobre los archivos de muestra de la UNQ, el 100% de las materias (61) aparecen en el
  resultado con su nombre y código correctos, y el PDF y el Excel con el mismo contenido producen
  las mismas materias.
- **SC-003**: El 100% de los datos que el archivo no informa (año del plan, correlativas, créditos,
  origen, estado) están marcados como sin asignar o "sin determinar", y ninguno está completado con
  un valor inventado o deducido.
- **SC-004**: En el 100% de los casos con archivo inválido, vacío, demasiado grande o sin materias
  extraíbles, el estudiante recibe un aviso claro de la causa, y nunca un resultado vacío.
- **SC-005**: El estudiante no necesita transcribir manualmente ninguna materia que el sistema
  haya detectado correctamente.
- **SC-006**: Ningún dato personal del alumno (nombre, legajo) aparece en las respuestas ni en los
  registros del sistema, verificado en el 100% de las pruebas con los archivos de muestra.

## Assumptions

- Los formatos soportados son PDF y Excel (.xls). El formato objetivo es el reporte "Plan de
  estudios" de SIU Guaraní de la UNQ: una tabla con las columnas Actividad, Tipo, Año, Período,
  Nota, Origen, Créditos y Puntaje, agrupada por módulos y bloques "Materia genérica". Otros
  diseños se toleran de forma parcial.
- El formato Excel de la versión moderna (.xlsx) queda fuera de alcance, salvo que se decida
  incluirlo; se pidió explícitamente .xls.
- Las columnas se reconocen por el nombre de su encabezado, no por su posición; la columna Puntaje
  no se extrae.
- Solo se reconoce como condición de aprobación "Promocionado" (la única observada en la muestra)
  y "Aprobado". Cualquier otra condición se devuelve como estado literal no interpretado.
- El formato de SIU no informa materias "en curso" ni correlativas; esas reglas se aplican si un
  archivo las trae (por ejemplo, una columna de correlativas) y se validan con archivos sintéticos.
- Las marcas `(*)`, `(-)` y `(!)` de optativas compartidas no aparecen sobre las materias de la
  muestra; si aparecen, no forman parte del nombre y no se interpretan en esta feature. Si una
  optativa compartida figura en más de un bloque, se conserva la primera aparición.
- El resultado de revisión no se guarda en ningún lado: si el estudiante cierra o recarga, debe
  volver a subir el archivo. La persistencia es una feature posterior.
- No se usa reconocimiento de imágenes (OCR): un PDF escaneado sin texto seleccionable se rechaza si
  no se extrae ninguna materia.
- Tamaño máximo de archivo de 10 MB para ambos formatos; por encima se rechaza.
- La carga no requiere iniciar sesión, en línea con que Cuatri sea usable sin cuenta.
- Fuera de alcance: la persistencia del plan extraído, la validación de que las correlativas
  detectadas existan entre sí (se valida al confirmar), el filtrado de módulos de otras propuestas
  y cualquier corrección o enriquecimiento manual del resultado.
- Decisión de diseño: fallar en detectar un dato (año del plan, correlativas, créditos, estado) es
  un resultado parcial válido, porque el reporte real de la facultad no siempre lo trae.
- Riesgo aceptado: con reportes de formato muy distinto al de SIU Guaraní (otra universidad, otro
  diseño) la tasa de extracción puede ser baja; no se resuelve aquí y se mitiga con el
  enriquecimiento manual posterior.
