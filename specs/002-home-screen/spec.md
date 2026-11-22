# Feature Specification: Pantalla de inicio (home) de Cuatri

**Feature Branch**: `002-home-screen` (sin rama creada; no hay hook de git configurado)

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Pantalla de inicio (home) de Cuatri, el planificador de cursada multi-carrera. Es la primera pantalla que ve una persona estudiante y debe explicar en pocos segundos qué hace Cuatri y llevarla a empezar. Se implementa a partir de un diseño visual ya definido (mockup) y de la guía de estilo de Cuatri."

## Clarifications

### Session 2026-11-21

- Q: ¿Qué color lleva el resaltado "sin volverte loca." (el rosa del mockup no llega al contraste AA)? → A: El rosa profundo de la guía de estilo, que cumple AA (6,6:1 sobre el fondo crema).
- Q: ¿Qué hace "Salir", si Cuatri funciona sin cuenta ni sesión? → A: No se muestra hasta que exista la sesión; sin "Salir" tampoco hay pie de página.
- Q: ¿Se mantiene el texto "O explorá un plan de ejemplo para ver cómo funciona." debajo del botón? → A: No, se quita. Se agregará junto con la feature del plan de ejemplo, cuando exista.

- Q: ¿Qué hace el botón principal ahora que existe la pantalla de carga de la carrera (feature 003)? → A: Lleva a esa pantalla como un enlace real; el aviso de "próximamente" se retira.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entender qué es Cuatri y ver cómo empezar (Priority: P1)

Una persona estudiante abre Cuatri por primera vez. En la primera pantalla, centrada, ve la marca
(logo y nombre), un título que promete el beneficio ("Planificá tu cursada sin volverte loca."),
una bajada que explica qué hace Cuatri, los tres pasos del proceso y un botón claro para empezar.

**Why this priority**: Es la puerta de entrada de la aplicación. Si no comunica qué hace Cuatri ni
cómo empezar, el resto del producto no se usa.

**Independent Test**: Abrir la pantalla en computadora y en celular y verificar que aparecen, en
ese orden, la franja de colores, el logo, el nombre, el título, la bajada, los tres pasos, el botón
principal; y que una persona que ve la pantalla 10 segundos puede
contar qué hace Cuatri.

**Acceptance Scenarios**:

1. **Given** una persona que abre Cuatri sin cuenta, **When** carga la pantalla de inicio, **Then**
   ve de arriba hacia abajo, centrados: una franja fina con los colores del arcoíris pastel en el
   borde superior, el logo, el nombre "Cuatri", el título en dos líneas, la bajada, tres pasos, el
   botón "+ Cargar mi primera carrera". No hay pie de página, opción "Salir" ni enlace a un plan
   de ejemplo.
2. **Given** la pantalla de inicio, **When** la persona lee el título, **Then** la primera línea es
   "Planificá tu cursada" y la segunda, "sin volverte loca.", resaltada con el rosa profundo de la guía.
3. **Given** la pantalla de inicio, **When** la persona lee la bajada, **Then** dice: "Cargá tu
   carrera, marcá lo que aprobaste y Cuatri te muestra qué podés cursar, en qué orden y cuánto te
   queda."
4. **Given** la pantalla de inicio, **When** la persona mira los pasos, **Then** ve tres etiquetas
   numeradas y de colores pastel distintos: "1 Cargá tu carrera" (rosa), "2 Marcá tus materias"
   (verde) y "3 Generá opciones de cursada" (celeste); son informativas y no se pueden activar.
5. **Given** la pantalla de inicio, **When** se la compara con el estado de servicio que mostraba el
   placeholder anterior, **Then** ese indicador ya no aparece.

---

### User Story 2 - El botón principal lleva a cargar la carrera (Priority: P1)

El botón principal ("+ Cargar mi primera carrera") es un enlace que lleva a la pantalla de carga de
la carrera (feature 003). Mientras esa feature no estaba, el botón mostraba un aviso de
"próximamente"; ese aviso se retiró al implementarla (2026-11-21).

**Why this priority**: Es la acción principal del inicio: si no lleva a ningún lado o falla, la
persona no puede empezar.

**Independent Test**: Activar el botón con mouse, con teclado y con toque, y verificar que lleva a la
pantalla de carga de la carrera y que se puede volver al inicio.

**Acceptance Scenarios**:

1. **Given** la pantalla de inicio, **When** la persona activa "+ Cargar mi primera carrera",
   **Then** llega a la pantalla de carga de la carrera.
2. **Given** la pantalla de inicio, **When** la persona usa solo teclado, **Then** el botón
   principal se alcanza con Tab y se activa con Enter.
3. **Given** el botón principal, **When** la persona lo abre en una pestaña nueva (por ejemplo con
   clic del medio), **Then** la pantalla de carga se abre igual, porque es un enlace real.
4. **Given** la pantalla de inicio, **When** se la mira, **Then** no hay avisos de "próximamente".

---

### User Story 3 - La pantalla es accesible y se adapta a cualquier dispositivo (Priority: P2)

La pantalla se ve y se usa bien en computadora y en celular, se puede recorrer solo con teclado y
cumple los contrastes de accesibilidad, con los colores y tipografías de la guía de estilo.

**Why this priority**: Es un requisito de calidad que aplica a toda la pantalla; es secundario
porque no agrega contenido, pero es necesario para que cualquier estudiante pueda usarla.

**Independent Test**: Revisar la pantalla en anchos desde 320 px hasta 1920 px, con zoom de 200 %,
recorrerla solo con la tecla Tab y medir los contrastes de cada par de colores.

**Acceptance Scenarios**:

1. **Given** un celular de 360 px de ancho, **When** se abre la pantalla, **Then** el contenido se
   reordena sin desplazamiento horizontal y el título y el botón principal se ven sin desplazarse
   hacia abajo.
2. **Given** una computadora de pantalla ancha, **When** se abre la pantalla, **Then** el contenido
   queda centrado con un ancho de lectura cómodo, sin estirarse de borde a borde.
3. **Given** el uso solo con teclado, **When** la persona avanza con Tab, **Then** pasa al
   botón principal, que muestra un indicador de foco claramente visible.
4. **Given** cualquier texto de la pantalla, **When** se mide su contraste con el fondo, **Then**
   cumple el nivel AA de accesibilidad (4.5:1, o 3:1 si es texto grande).

---

### Edge Cases

- Pantalla muy angosta (320 px): el título se parte en más líneas y los tres pasos se apilan, sin
  cortarse ni generar desplazamiento horizontal.
- Zoom de texto al 200 %: todo el contenido sigue legible y alcanzable.
- El logo no carga: la marca se sigue entendiendo por el nombre "Cuatri" y por el texto alternativo
  del logo.
- Pantalla muy ancha: el contenido no se estira; mantiene un ancho máximo y queda centrado.
- La persona vuelve al inicio desde la pantalla de carga: el inicio se ve igual que al entrar.
- Preferencia del sistema de reducir el movimiento: la pantalla no tiene animaciones necesarias
  para entenderla.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla MUST mostrar una franja fina con los colores del arcoíris pastel en el
  borde superior de la página.
- **FR-002**: La pantalla MUST mostrar el logo de Cuatri (ícono redondeado con una "C" en arcoíris)
  y, debajo, el nombre "Cuatri" en el color de marca.
- **FR-003**: La pantalla MUST mostrar el título en dos líneas: "Planificá tu cursada" en el color de
  texto principal y "sin volverte loca." resaltada con el rosa profundo de la guía de estilo (el
  rosa claro del mockup no llega al contraste AA, por eso se usa el profundo).
- **FR-004**: La pantalla MUST mostrar la bajada: "Cargá tu carrera, marcá lo que aprobaste y
  Cuatri te muestra qué podés cursar, en qué orden y cuánto te queda."
- **FR-005**: La pantalla MUST mostrar tres pasos numerados, informativos y no interactivos, cada
  uno con un color pastel distinto de la guía: "1 Cargá tu carrera" (rosa), "2 Marcá tus materias"
  (verde) y "3 Generá opciones de cursada" (celeste).
- **FR-006**: La pantalla MUST mostrar un botón principal destacado con el texto "+ Cargar mi
  primera carrera".
- **FR-007**: La pantalla MUST NOT mostrar el texto "O explorá un plan de ejemplo para ver cómo
  funciona." ni ningún enlace a un plan de ejemplo mientras esa feature no exista; se agregará
  junto con ella.
- **FR-008**: La pantalla MUST NOT mostrar la opción "Salir" ni un pie de página mientras no exista
  la sesión de usuario (Cuatri funciona sin cuenta); cuando se especifique la sesión, se agregará
  junto con su comportamiento.
- **FR-009**: Al activar el botón principal, la pantalla MUST llevar a la pantalla de carga de la
  carrera (feature 003). El botón MUST ser un enlace de navegación real (se puede abrir en otra
  pestaña) y MUST NOT mostrar errores.
- **FR-010**: (Retirado el 2026-11-21) El aviso de "próximamente" del botón principal ya no existe;
  el inicio MUST NOT mostrar avisos de ese tipo.
- **FR-011**: (Retirado el 2026-11-21 junto con el aviso.)
- **FR-012**: La pantalla MUST ser usable sin cuenta y sin haber iniciado sesión.
- **FR-013**: La pantalla MUST ser responsiva: legible y sin desplazamiento horizontal desde 320 px
  hasta 1920 px de ancho, con el contenido centrado y un ancho máximo de lectura.
- **FR-014**: La pantalla MUST usar solo los colores y las tipografías de la guía de estilo de
  Cuatri.
- **FR-015**: Todo texto de la pantalla MUST cumplir el contraste AA (4.5:1; 3:1 para texto grande)
  respecto de su fondo.
- **FR-016**: Todos los elementos interactivos MUST ser alcanzables y activables con teclado, en
  orden lógico, y MUST mostrar un indicador de foco claramente visible.
- **FR-017**: La pantalla MUST NOT mostrar el indicador de estado del servicio que tenía el
  placeholder anterior.
- **FR-018**: Todos los textos de la pantalla MUST estar en español rioplatense (con voseo), tal
  como figuran en esta especificación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos 4 de cada 5 personas de prueba, tras mirar la pantalla durante 10 segundos,
  pueden explicar en una frase qué hace Cuatri.
- **SC-002**: El título y el botón principal se ven sin desplazarse hacia abajo en pantallas de
  360 × 640 px y de 1280 × 720 px.
- **SC-003**: El 100 % de los pares de color texto/fondo de la pantalla cumple el contraste AA.
- **SC-004**: El 100 % de los elementos interactivos se puede alcanzar y activar solo con teclado y
  muestra un foco visible.
- **SC-005**: No hay desplazamiento horizontal en ningún ancho entre 320 px y 1920 px, ni con zoom
  de texto al 200 %.
- **SC-006**: Al activar el botón principal, la pantalla de carga de la carrera aparece en menos de
  1 segundo, sin errores visibles, en el 100 % de los intentos.

## Assumptions

- El diseño de referencia es el mockup compartido y la guía de estilo de Cuatri (paleta crema, rosa
  y lavanda con detalles arcoíris pastel). Las tipografías son las de la guía.
- El logo es el oficial de Cuatri y lo aporta el equipo como archivo; hasta contar con él se usa un
  ícono provisorio con el mismo tamaño y posición.
- La pantalla de inicio es la primera que se abre al entrar a Cuatri.
- Solo se define el modo claro, porque la guía de estilo no define uno oscuro.
- El aviso de "próximamente" se reemplazó por la navegación real a la pantalla de carga de la carrera
  (feature 003).
- Los tres pasos son solo informativos y no llevan a ningún lado.
- El diseño de referencia incluía un pie con "Salir"; se omite a propósito hasta que exista la
  sesión de usuario.
- El diseño de referencia incluía "O explorá un plan de ejemplo…" bajo el botón; se omite a
  propósito hasta que exista la feature del plan de ejemplo.
- Fuera de alcance: el flujo de carga de la carrera, el plan de ejemplo, la marcación de materias,
  la generación de cursada, y cualquier lógica de cuentas o sesión (incluido "Salir").
