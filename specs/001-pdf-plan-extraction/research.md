# Research y decisiones: Extracción de materias desde PDF o Excel

## Evidencia: los archivos de muestra

Se analizaron un PDF (5 páginas) y un `.xls` del reporte "Plan de estudios" de SIU Guaraní, con el
mismo contenido:

- Tabla de 8 columnas: Actividad, Tipo, Año, Período, Nota, Origen, Créditos, Puntaje.
- 61 materias, todas con código entre paréntesis (`80000`, `8003N`, `751N`...), sin duplicados.
- 24 aprobadas, con nota `N (Promocionado)` y origen `Promoción`; Año y Período siempre vacíos; sin
  columna de correlativas.
- 8 encabezados de grupo (5 `MÓDULO:` y 3 `MATERIA GENÉRICA:`), incluido un módulo de otra propuesta
  (diplomatura). Un módulo empieza al final de una página y su tabla sigue en la siguiente.
- Leyendas `(*)`, `(-)`, `(!)` al final; ninguna sobre una materia.
- `pdfplumber.extract_tables()` devuelve la misma estructura de 8 columnas que el Excel.
- El `.xls` es un documento compuesto de Office válido, pero `xlrd` lo rechaza como corrupto salvo
  con `ignore_workbook_corruption=True`; `python-calamine` lo lee sin opciones. Tiene una hoja
  ("Reporte").
- Ambos archivos contienen nombre y legajo del alumno.

## R-01. Parser determinístico en vez de LLM (cambia el enfoque original)

- **Decision**: la interpretación es una función pura del Dominio (`parse_plan`) sobre una
  estructura intermedia; no se usa ningún LLM.
- **Rationale**: ambos formatos son tablas con encabezados fijos que se leen con reglas simples.
  Evita enviar datos personales a un tercero (FR-014; resuelve Q-06), elimina la API key, el costo,
  la latencia, los reintentos y el no determinismo, y permite 100 % de precisión medible (SC-002).
- **Alternatives**: LLM (Gemini), propuesto originalmente por flexibilidad ante otros diseños.
  Se descarta para esta feature; puede reincorporarse más adelante como un tercer puerto de
  fallback para diseños no reconocidos sin tocar el Dominio.
- **Riesgo**: con una sola carrera de muestra, otros planes pueden variar (columnas, nombres de
  módulo). Se mitiga reconociendo columnas por nombre de encabezado y rechazando con
  `no_subjects_found` en lugar de adivinar.

## R-02. Arquitectura: lectores → estructura intermedia → Dominio

- **Decision**: dos Adapters (`pdf_plan_reader`, `xls_plan_reader`) implementan el puerto
  `PlanFileReader` y producen `RawPlan`; el Dominio `parse_plan` lo convierte en
  `ResultadoExtraccion`; el Service detecta el formato, elige el lector y llama al Dominio.
- **Rationale**: Principio I (el Service no importa Adapters: usa puertos y recibe los lectores por
  inyección desde `app/core/wiring.py`); la lógica de negocio (qué es una materia, estado, módulo,
  optativa) queda en el Dominio, testeable sin PDF ni Excel y con Hypothesis; las librerías de
  lectura son reemplazables de forma independiente, como pedía el enfoque original.
- **Alternatives**: parsear dentro de cada Adapter (duplica reglas y viola "sin lógica en
  Adapters"); un único Adapter (descartado por el usuario).

## R-03. Lectura de PDF con `pdfplumber`

- **Decision**: por página, `find_tables()` para las tablas y las líneas de texto fuera de las
  tablas para los títulos de módulo y el encabezado; se ordenan por posición vertical y se emiten
  como `Heading` / `TableRow` / `TextLine`. El módulo vigente se arrastra entre páginas (lo hace el
  parser, no el lector).
- **Rationale**: verificado sobre la muestra: las tablas salen con 8 columnas y celdas vacías
  correctas (esencial: Año y Período vacíos no deben desplazar la nota).
- **Privacidad**: `pdfminer` registra el contenido del documento en nivel DEBUG; el lector fija su
  logger en WARNING para que los datos del alumno nunca se registren (un test lo cubre).
- **Fallos**: PDF corrupto o protegido → `InvalidFileError`. Limitación conocida: un título de
  módulo que ocupe varias líneas no se une (las muestras reales tienen títulos de una línea); unirlos
  por posición confundiría el encabezado de la página siguiente con una continuación.
- **Alternatives**: `pypdf`/texto plano (pierde las celdas vacías y confunde columnas).

## R-04. Lectura de `.xls` con `python-calamine`

- **Decision**: `python-calamine` abre el contenido en memoria y entrega los valores de las celdas
  de todas las hojas visibles; cada fila no vacía se emite como `TableRow` (las filas de una sola
  celda con texto se emiten como `Heading` o `TextLine` según su prefijo).
- **Rationale**: lee la muestra real sin opciones especiales, solo lee valores (nunca ejecuta
  macros, FR-021) y no tiene dependencias del sistema.
- **Alternatives**: `xlrd` (rechaza la muestra salvo con un flag no documentado como estable),
  `pandas` (peso innecesario). Hay que confirmar que se pueda abrir desde bytes
  (`from_filelike`) al implementar.
- **Fallos**: documento compuesto que no es un libro de Excel (por ejemplo un `.doc`) o contenido
  corrupto → `InvalidFileError`.

## R-05. Detección de formato por contenido (FR-002)

- **Decision**: función pura `detect_file_format` en el Dominio por firma (`%PDF-`; cabecera de
  documento compuesto de Office). La extensión se ignora. La firma de Office no distingue un `.xls`
  de un `.doc`; el lector lo resuelve (R-04).
- **Rationale**: "imagen llamada plan.xls" y similares se rechazan sin depender del nombre.

## R-06. Reglas de interpretación (resumen)

- **Columnas** por nombre de encabezado (sin distinguir mayúsculas ni tildes); la fila de encabezado
  se repite en cada tabla y se ignora como dato.
- **Actividad** `Nombre (CÓDIGO)` → `name` y `code` con una expresión sobre el último paréntesis.
- **Grupo**: línea que empieza con `MÓDULO:` o `MATERIA GENÉRICA:`; las filas siguientes lo heredan
  hasta el próximo encabezado de grupo, incluso en otra página. Se omite el segmento raíz
  `Plan basico`, que el PDF y el XLS reales escriben distinto en las genéricas. Genérica → `is_elective`.
- **Estado**: ver data-model.md; conservador: ante la duda, `unparsed`, nunca aprobada.
- **Correlativas**: sin columna → `None`. Con columna "Correlativas" (o "Requisitos"): celda vacía →
  `None`; "-", "Ninguna" o "Sin correlativas" → `()`; si no, ítems separados por `;`, y cada uno es `subject` si tiene la forma `Nombre (CÓDIGO)` y `unparsed` si no. No hay
  muestra real con correlativas: estas reglas son de baja confianza y se validan con archivos
  sintéticos.
- **Ignorados**: filas vacías, leyendas de una celda, pies de página, encabezado con datos del
  alumno (`Alumno:`, `Legajo:`), que nunca se leen hacia el resultado ni se loguean.
- **Duplicados**: por código (o nombre normalizado sin código), se conserva la primera aparición.

## R-07. Privacidad (FR-014)

- Los lectores y el parser ignoran las líneas `Alumno:` y `Legajo:`; no existen en ninguna entidad
  ni en las respuestas.
- No se registra contenido del archivo; solo códigos de error, formato y tamaño.
- Sin servicios de terceros: no hay llamadas de red en esta feature.
- Los archivos de muestra reales contienen datos personales: se guardan en
  `backend/tests/fixtures/private/` (ignorada por git) y los tests automáticos usan archivos
  sintéticos que imitan su estructura.

## R-08. Estado HTTP fuera del Dominio

`app/domain/errors.py` declara hoy `status_code` en `DomainError` (Principio I: el Dominio no
conoce HTTP). **Decision**: el Dominio solo define `code`; `app/core/errors.py` mapea `code` →
estado HTTP. `/health` (503) no cambia.

## R-09. Validación del tamaño y del archivo

- El Controller lee el cuerpo con un tope de `MAX_UPLOAD_BYTES + 1` bytes y entrega `bytes` al
  Service. El Service valida vacío, tamaño y formato (por contenido). El tope por defecto es 10 MB
  (spec); configurable.

## R-10. Pruebas

- **Dominio (sin FastAPI ni archivos)**: `parse_plan` con `RawPlan` armados a mano; entidades;
  `detect_file_format`; limpieza de texto. **Hypothesis**: limpieza idempotente que no cambia
  mayúsculas ni tildes; deduplicación sin repetidos y con orden estable; el parser nunca produce una
  materia que no esté en las filas de entrada ni un estado `approved` sin nota válida.
- **Adapters**: sobre PDF y XLS sintéticos con la misma estructura que la muestra real
  (módulo que continúa en otra página, genérica, otra propuesta, leyendas, encabezados repetidos).
- **Equivalencia**: el mismo contenido en PDF y en XLS produce las mismas materias.
- **API (TestClient)**: ambos formatos, todos los errores, y ausencia de datos del alumno en
  respuesta y logs.
- **Muestras reales**: tests que se saltan si `tests/fixtures/private/` no existe; verifican 61
  materias, 24 aprobadas, igualdad entre formatos.
- **Testcontainers**: no aplica, no hay base de datos.

## R-11. Configuración y deploy

Única variable nueva: `MAX_UPLOAD_BYTES`. No hay secretos nuevos. Las dependencias (`pdfplumber`,
`python-calamine`) deben instalarse en la imagen Docker de Render sin paquetes del sistema; se
verifica en el deploy.
