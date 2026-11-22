# Contrato de interfaz: Cargar la carrera

> Documento de **diseño** de la pantalla (textos, estados, estructura, foco y responsive). Los textos
> son propuesta del asistente (Q-03), en español rioplatense.

Ruta: `/cargar-carrera` (tentativa, Q-01). Se llega desde el botón "+ Cargar mi primera carrera" del
inicio, que pasa a ser un enlace.

## Textos

| Elemento | Texto |
|----------|-------|
| Título (`h1`) | `Cargá tu carrera` |
| Explicación | `Subí el reporte «Plan de estudios» que descargás desde el sistema de la facultad (SIU Guaraní). Aceptamos PDF y Excel (.xls) de hasta 10 MB.` |
| Área de carga | `Arrastrá tu archivo acá` · `o` · botón `Elegir archivo` |
| Área al arrastrar | `Soltá el archivo acá` |
| Archivo elegido | `{nombre} ({tamaño})` · `Cambiar archivo` · botón principal `Analizar mi plan` |
| Varios archivos soltados | `Soltaste {n} archivos. Elegí cuál querés analizar:` + un botón por archivo |
| Analizando | `Analizando tu plan…` |
| Demora (10 s) | `Esto está tardando un poco más de lo normal. ¡Ya casi!` |
| Título del resultado (`h2`) | `Esto es lo que encontramos` |
| Resumen | `Carrera: {program} · Plan: {plan} · Versión: {version}` (solo los que existan) y `{n} materias detectadas · {m} aprobadas` |
| Módulo (`h3`) | `{nombre del módulo} ({cantidad})` · sin módulo: `Sin módulo ({cantidad})` |
| Materia | `{código}` · `{nombre}` · `{créditos} créditos` · chips |
| Chips | `Optativa` · `Aprobada · nota {N}` · `En curso` · `Sin estado` · estado literal del archivo |
| Dato ausente | `sin dato` |
| Nota de "sin determinar" | `El año del plan y las correlativas figuran como «sin determinar» porque el archivo no los trae. Más adelante vas a poder completarlos.` |
| Aviso de revisión | `Este resultado es solo para revisar y todavía no se guarda. Si salís o recargás, vas a tener que volver a subir el archivo.` |
| Acciones | `Cargar otro archivo` · `Volver al inicio` |

### Errores (`role="alert"`)

| Causa | Mensaje | Acciones |
|-------|---------|----------|
| `invalid_file` | `Ese archivo no parece un PDF ni un Excel (.xls) válido. Probá con el reporte «Plan de estudios» tal como lo descargaste.` | `Elegir otro archivo` |
| `empty_file` | `El archivo está vacío. Elegí otro.` | `Elegir otro archivo` |
| `file_too_large` | `El archivo pesa más de 10 MB. Elegí uno más liviano.` | `Elegir otro archivo` |
| `no_subjects_found` | `No encontramos materias en ese archivo. Revisá que sea el reporte «Plan de estudios» y probá de nuevo.` | `Elegir otro archivo` |
| `service_unavailable` | `No pudimos conectarnos con el servicio. Revisá tu conexión y probá de nuevo en un momento.` | `Reintentar` · `Elegir otro archivo` |

Los errores de formato, tamaño y vacío se muestran **antes de enviar** cuando se pueden detectar en el
archivo elegido.

## Estados y qué se ve

| Estado | Pantalla |
|--------|----------|
| `idle` | Título, explicación y área de carga |
| `selected` | Lo anterior + nombre y tamaño + "Cambiar archivo" + "Analizar mi plan" |
| `analyzing` | Estado de carga; botón deshabilitado; aviso de demora si `slow` |
| `success` | Resumen, nota de "sin determinar", aviso de revisión, módulos con sus materias y acciones |
| `error` | Mensaje de la causa con sus acciones |

## Estructura y regiones

- `main` con el `h1`, la explicación y el área de carga (siempre que no haya resultado).
- Región `role="status"` (`aria-live="polite"`) **siempre presente**: anuncia "Analizando tu plan…", el
  aviso de demora y "{n} materias detectadas, {m} aprobadas".
- El resultado: `h2` → resumen → nota de "sin determinar" → aviso de revisión → una `section` por
  módulo (`aria-labelledby` del `h3`) con una lista `ul` de materias → acciones.
- El error vive en un contenedor `role="alert"`.

## Foco y teclado

| Momento | Dónde queda el foco |
|---------|---------------------|
| Entrar a la pantalla | Al principio (comportamiento normal del navegador) |
| Archivo elegido | En el botón "Analizar mi plan" |
| Resultado listo | En el `h2` del resultado (`tabIndex=-1`) |
| Error | En el contenedor del mensaje |
| "Cargar otro archivo" | En "Elegir archivo" |
| "Cambiar archivo" | Abre el selector de archivos |

Orden de Tab: "Elegir archivo" → (con archivo) "Cambiar archivo" → "Analizar mi plan" → (con resultado)
"Cargar otro archivo" → "Volver al inicio". Todo lo que se hace arrastrando se puede hacer con el
botón y con teclado.

## Responsive y legibilidad

| Ancho | Comportamiento |
|-------|----------------|
| 320 px | Todo apilado; las materias son tarjetas; sin scroll horizontal |
| 360 px | Título y área de carga visibles sin desplazarse; 60+ materias legibles |
| 1280 px | Contenido centrado con ancho de lectura; materias en fila |
| 1920 px | Ancho máximo de lectura, centrado |
| Zoom 200 % | Todo alcanzable, sin scroll horizontal |

## Estilo

- Mismos tokens y tipografías de la guía; ninguna clase con color suelto.
- Área de carga: borde discontinuo `control-border`; al arrastrar, borde rosa profundo.
- Error: rosa pastel (`#F9CFD8`, texto `#6B2237`); aviso de revisión: amarillo pastel.
- Chips: optativa en violeta, aprobada en verde, "Sin estado" neutro.
- Sin animaciones necesarias; el spinner de carga es decorativo y se detiene con
  `prefers-reduced-motion`.
