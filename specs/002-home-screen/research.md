# Research y decisiones: Pantalla de inicio (home)

## R-01. Tokens de la guía en un solo lugar

- **Decision**: bloque `@theme` de Tailwind CSS 4 en `frontend/src/index.css` con todos los colores y
  las dos familias tipográficas de la guía de estilo. Los componentes usan solo clases derivadas de
  esos tokens (`bg-cream`, `text-ink`, `border-rose-deep`...), nunca colores sueltos.
- **Rationale**: la guía dice "todo se define como tokens en un solo lugar" y FR-014 exige usar solo
  sus colores. Tailwind 4 genera las utilidades desde `@theme`, sin archivo de configuración aparte.
- **Verificación**: un test lee `index.css`, extrae las variables `--color-*` y comprueba contrastes
  (R-03); otro test falla si un componente contiene un color hexadecimal literal.
- **Alternatives**: constantes en TypeScript (duplica la fuente de verdad); colores arbitrarios de
  Tailwind `bg-[#E2B3C4]` (dispersa los valores).

## R-02. Tipografías autoalojadas

- **Decision**: `@fontsource-variable/montserrat` (títulos y marca) y
  `@fontsource-variable/source-sans-3` (cuerpo), importadas en `main.tsx`; tokens `--font-display` y
  `--font-body`; `font-display: swap`.
- **Rationale**: no se piden fuentes a terceros (privacidad y velocidad), funcionan sin conexión
  externa y las versiones variables cubren los pesos con un solo archivo. Los dos paquetes existen
  (Montserrat 5.3.0, Source Sans 3 5.3.1).
- **Supuesto a confirmar (Q-01)**: las familias salen del screenshot de la guía, no de un dato del
  usuario.
- **Alternatives**: Google Fonts (pedido a un tercero); fuentes del sistema (pierde la identidad).

## R-03. Contraste: hallazgos y ajustes

Calculado con la fórmula WCAG 2.x sobre los valores de la guía:

| Par | Contraste | Mínimo | Resultado |
|-----|-----------|--------|-----------|
| Texto `#3B3A3A` sobre crema `#FDFBF7` | 10,97 | 4,5 | OK |
| Rosa profundo `#8F4562` sobre crema (2ª línea del título, enlace) | 6,36 | 3 / 4,5 | OK |
| Texto secundario `#6B6868` sobre crema (texto de ayuda) | 5,34 | 4,5 | OK |
| Texto `#3B3A3A` sobre rosa empolvado `#E2B3C4` (botón) | 6,20 | 4,5 | OK |
| Pill rosa `#6B2237` / `#F9CFD8` | 7,83 | 4,5 | OK |
| Pill verde `#1F5133` / `#CDEFD6` | 7,41 | 4,5 | OK |
| Pill celeste `#17476B` / `#CBE6F8` | 7,54 | 4,5 | OK |
| Aviso `#5A4800` / `#FBEFB5` | 7,67 | 4,5 | OK |
| Anillo de foco rosa profundo sobre crema | 6,36 | 3 | OK |
| Anillo de foco rosa profundo sobre el botón rosa empolvado | 3,59 | 3 | OK |
| **Rosa del mockup `#E58AA0` sobre crema** | **2,40** | 3 | **Falla** |
| **Anillo azul lavanda `#A6B1E2` sobre crema** | **2,03** | 3 | **Falla** |
| **Número `#6B2237` en el círculo rosa `#E58AA0`** | **4,44** | 4,5 | **Falla por poco** |

**Decisiones**:
- La 2ª línea del título usa rosa profundo (decisión ya tomada en el spec).
- El anillo de foco usa rosa profundo, no azul lavanda, con 2 px de desplazamiento.
- Los números dentro de los círculos de los pasos usan el texto principal `#3B3A3A`: 4,58 sobre rosa
  `#E58AA0`, 5,58 sobre verde `#7BC693` y 5,29 sobre celeste `#7DB8E0`.
- El botón principal lleva borde de rosa profundo (3:1 contra el fondo para que el control sea
  identificable); el mockup mostraba un borde rosa apenas más oscuro que el relleno.
- Los bordes de colores de los pills son decorativos: la información la da el texto, que cumple.

## R-04. Aviso accesible

- **Decision**: un único contenedor `role="status"` (`aria-live="polite"`) **siempre presente** en el
  DOM; el aviso aparece dentro de él. El botón "Cerrar aviso" lo limpia. El foco **no se mueve**:
  se queda en el disparador. Si se activa otra acción con un aviso visible, el contenido se
  reemplaza (nunca dos a la vez). Activar la misma acción dos veces no duplica ni re-anuncia.
- **Rationale**: los lectores de pantalla solo anuncian cambios en regiones vivas que ya existían;
  mover el foco desorienta en un mensaje informativo que no requiere respuesta.
- **Alternatives**: `role="alert"` (interrumpe, es excesivo para algo amable); modal (bloqueante y
  desproporcionado).

## R-05. "Un plan de ejemplo" implementado como botón

- **Decision**: elemento `<button type="button">` con aspecto de enlace.
- **Rationale**: hoy no hay destino y la activación dispara una acción, no una navegación. Un
  `<a>` sin destino real se anuncia mal y engaña. Cuando exista la feature, pasa a ser un enlace
  real.
- **Alternatives**: `<a href="#">` (salta al inicio de la página y es semánticamente incorrecto).

## R-06. Retirada del placeholder

- **Decision**: se eliminan `hooks/useHealth.ts`, `service/healthService.ts`, `types/health.ts` y los
  dos tests de `HomePage.test.tsx` que ejercitan el indicador de estado. `VITE_API_URL` queda sin
  uso por ahora; se conserva su tipado para las próximas features.
- **Condición**: borrar o reemplazar tests exige permiso explícito (Principio VII → Q-02).
- **Rationale**: el spec elimina el indicador (FR-017); dejar el código sin usar es deuda.

## R-07. Estrategia de pruebas

- **Vitest + RTL**: textos exactos y orden del DOM, ausencia de "Salir" y de pie de página,
  semántica (`h1`, lista ordenada, botones, región `status`), orden de tabulación (botón principal →
  plan de ejemplo), avisos (aparece, se reemplaza, se cierra, no se duplica), texto alternativo del
  logo.
- **Contraste automático**: un test parsea `index.css` y verifica con la fórmula WCAG cada par de la
  tabla de R-03 (mínimos 4,5 / 3).
- **Arquitectura frontend**: un test recorre `src/components` y `src/pages` y falla si encuentra
  `fetch(` o imports de `service/`, y si un componente tiene un color hexadecimal literal. Cubre el
  hueco de que `import-linter` solo revisa Python (Principio VII).
- **Accesibilidad**: `vitest-axe` (0.1.0) resultó compatible con Vitest 4 y se usa en
  `HomePage.a11y.test.tsx`, junto con consultas por rol y nombre accesible.
- **Lo que jsdom no puede medir** (layout, scroll horizontal, zoom, foco visible real): verificación
  manual en el quickstart y repetida contra el deploy de Vercel.
- **Playwright u otra herramienta de UI**: no se agrega; la constitución define Vitest + RTL.

## R-08. Responsive

- **Decision**: mobile-first. Columna centrada con ancho máximo de lectura (`max-w-2xl`), `min-h-dvh`,
  título fluido con `clamp()`, pills en `flex-wrap` centrado, anchos relativos (sin anchos fijos
  salvo el logo de 72 px con `width`/`height` declarados para evitar saltos de layout). A 320 px el
  título se parte en más líneas y los pills se apilan.
- **Rationale**: SC-002 y SC-005 piden título y botón sin scroll vertical en 360×640 y 1280×720 y
  sin scroll horizontal de 320 a 1920 px.

## R-09. Movimiento reducido

- **Decision**: no hay animaciones necesarias; solo transiciones de color en hover y foco, que se
  desactivan con `@media (prefers-reduced-motion: reduce)`.

## R-10. Metadatos, favicon y deploy

- **Decision**: `index.html` con `lang="es"`, título "Cuatri — Planificá tu cursada", meta
  description, favicon `/logo.svg` y `theme-color` crema. Sin cambios de infraestructura: Vercel ya
  despliega `main` con la configuración existente (`frontend/vercel.json`).
- **Verificación**: Principio IX, contra `https://cuatri.vercel.app`.
