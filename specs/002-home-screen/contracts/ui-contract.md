# Contrato de interfaz: Pantalla de inicio

> **Nota (2026-11-21)**: la feature 003 (cargar la carrera) reemplazó el aviso de "próximamente" por la
> navegación real. Todo lo que este documento dice sobre `Notice`, `useNotice` y los avisos quedó
> retirado; ver `specs/003-career-upload/` y `spec.md` de esta feature.

> Documento de **diseño** de la pantalla (textos, estructura, interacción y accesibilidad). No hay
> API ni endpoints en esta feature.

## Textos (español rioplatense, FR-018)

| Elemento | Texto exacto |
|----------|--------------|
| Marca | `Cuatri` |
| Título, línea 1 | `Planificá tu cursada` |
| Título, línea 2 (resaltada) | `sin volverte loca.` |
| Bajada | `Cargá tu carrera, marcá lo que aprobaste y Cuatri te muestra qué podés cursar, en qué orden y cuánto te queda.` |
| Paso 1 (rosa) | `Cargá tu carrera` |
| Paso 2 (verde) | `Marcá tus materias` |
| Paso 3 (celeste) | `Generá opciones de cursada` |
| Botón principal | `+ Cargar mi primera carrera` |
| Aviso `career` (propuesta, Q-03) | `Cargar tu carrera va a estar disponible muy pronto. ¡Gracias por la paciencia!` |
| Botón de cierre | nombre accesible `Cerrar aviso` |
| Texto alternativo del logo | `Logo de Cuatri` |

No existen: texto "Salir", pie de página, texto ni enlace de "plan de ejemplo" (se agregarán con su
feature) ni indicador de estado del servicio.

## Estructura y orden del DOM

1. Franja arcoíris (decorativa, `aria-hidden`).
2. `main` centrado:
   1. Logo → marca "Cuatri".
   2. `h1` con las dos líneas del título (la segunda en un `span`).
   3. Bajada (`p`).
   4. Lista ordenada (`ol`) con los tres pasos; sin navegación.
   5. Botón principal.
   6. Región `role="status"` (siempre presente) con el aviso.

## Interacción

| Acción | Resultado |
|--------|-----------|
| Activar el botón principal (clic, toque, Enter, Espacio) | Aparece el aviso `career`; no se cambia de pantalla; el foco se queda en el botón |
| Activar la misma acción otra vez | No cambia nada (sin duplicar) |
| Activar "Cerrar aviso" | El aviso desaparece y el foco vuelve al botón que lo abrió |
| Aparece un aviso fuera de la zona visible (pantallas bajas) | Se lo lleva a la vista (sin animación con movimiento reducido); el foco no se mueve |

Orden de tabulación: botón principal → (si hay aviso) "Cerrar aviso". Los
pasos no son enfocables.

## Accesibilidad

- Todo texto cumple AA (4,5:1; 3:1 si es grande) según la tabla de contrastes de
  [research.md](../research.md) R-03.
- Foco visible: anillo de 2 px en rosa profundo con 2 px de desplazamiento, en todo elemento
  interactivo.
- El aviso se anuncia por la región `status` sin mover el foco.
- Sin animaciones necesarias; transiciones de color desactivadas con `prefers-reduced-motion`.

## Responsive

| Ancho | Comportamiento |
|-------|----------------|
| 320 px | Título en más líneas, pasos apilados, sin scroll horizontal |
| 360 × 640 px | Título y botón principal visibles sin desplazarse |
| 1280 × 720 px | Título y botón principal visibles sin desplazarse; contenido centrado |
| 1920 px | Contenido centrado con ancho máximo de lectura |
| Zoom 200 % | Todo legible y alcanzable, sin scroll horizontal |
