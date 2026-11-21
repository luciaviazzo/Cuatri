# Implementation Plan: Pantalla de inicio (home) de Cuatri

**Branch**: `002-home-screen` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-home-screen/spec.md`

## Summary

Reemplazar el placeholder actual por el home real de Cuatri: franja arcoíris, logo, nombre, título
en dos líneas, bajada, tres pasos informativos, botón principal y enlace al plan de ejemplo. Los
dos disparadores muestran un aviso amable ("próximamente") porque sus flujos se especifican en otras
features. Sin pie de página ni "Salir", y sin el indicador de estado del servicio.

Enfoque técnico: solo frontend, sin red. React 19 + Tailwind CSS 4 con los **tokens de la guía de
estilo definidos en un solo lugar** (`@theme` en `index.css`), tipografías autoalojadas, estructura
por capas de la constitución (`pages/`, `components/`, `hooks/`, `types/`) y pruebas con Vitest +
React Testing Library, incluida una prueba automática de contraste WCAG sobre los tokens. Detalle en
[research.md](research.md), [data-model.md](data-model.md) y [contracts/](contracts/).

**Hallazgo del análisis**: el rosa del mockup para "sin volverte loca." (`#E58AA0`) tiene un
contraste de 2,40:1 sobre el crema (mínimo AA para texto grande: 3:1), por eso el spec adoptó el
rosa profundo de la guía (6,36:1). El mismo análisis ajustó otros tres detalles de color para que
todo el home cumpla AA (ver research R-03).

## Technical Context

**Language/Version**: TypeScript ~7.0 sobre React 19.3

**Primary Dependencies**: Vite 8, Tailwind CSS 4.3 (`@tailwindcss/vite`), React Testing Library 16 y
user-event 14 (existentes); nuevas: `@fontsource-variable/montserrat` y
`@fontsource-variable/source-sans-3`; opcional de desarrollo: `vitest-axe` (ver Q-05)

**Storage**: N/A (sin persistencia; el único estado es el aviso visible, en memoria)

**Testing**: Vitest 4 + jsdom + React Testing Library. El layout responsivo no se puede medir en
jsdom: se verifica de forma manual y contra el deploy (quickstart)

**Target Platform**: navegadores modernos de escritorio y celular; deploy en Vercel (ya conectado a
`main`)

**Project Type**: web-service, solo la parte `frontend/`

**Performance Goals**: título y botón principal visibles sin desplazarse (SC-002); fuentes
autoalojadas con `font-display: swap`, sin pedidos a terceros; sin librerías nuevas en tiempo de
ejecución más allá de las fuentes

**Constraints**: AA de contraste en todos los pares (FR-015); sin colores sueltos fuera de los
tokens (FR-014); sin scroll horizontal de 320 a 1920 px (SC-005); respeta
`prefers-reduced-motion`

**Scale/Scope**: una pantalla, 5 componentes, 1 hook

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|-----------|--------|-------|
| I. Capas backend | N/A | No se toca el backend. |
| II. Capas frontend | PASS | `pages/` (vista), `components/` (piezas sin HTTP), `hooks/` (estado del aviso), `types/`. No hay `service/` ni `contexts/` porque no hay red ni estado compartido. Un test de arquitectura frontend verifica que ningún componente use `fetch` ni importe `service/` (cubre el hueco de que import-linter solo revisa Python). |
| III. Estados derivados | N/A | No hay materias. |
| IV. Reglas extensibles | N/A | |
| V. Auth opcional | PASS | Sin cuenta ni sesión; por eso se omite "Salir". |
| VI. Validación por nivel | N/A | No hay entradas de usuario. |
| VII. Testing | **PASS con una condición** | Los 2 tests de `HomePage.test.tsx` prueban el indicador de estado que el spec elimina. Reemplazarlos o borrarlos exige permiso explícito (Q-02) antes de implementar. |
| VIII. OpenAPI automática | N/A | La API no cambia. |
| IX. Definición de terminado | **BLOQUEADO hasta el deploy** | Hay que verificar el home en la URL real de Vercel antes de darlo por terminado. |
| X. Idioma | PASS | Identificadores en inglés; textos de la pantalla en español rioplatense. |
| XI. Spec-first | PASS | Spec aprobado y sin marcadores pendientes. |

**Post-diseño**: igual. El diseño no agrega violaciones; quedan Q-02 (permiso sobre tests) y el
gate IX (deploy).

## Project Structure

### Documentation (this feature)

```text
specs/002-home-screen/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md             # lo genera /speckit-tasks
```

### Source Code (repository root)

```text
frontend/
├── index.html                       # lang es, título, descripción, favicon, theme-color
├── public/logo.svg                  # ya creado
└── src/
    ├── index.css                    # @theme con TODOS los tokens de la guía + base
    ├── main.tsx                     # importa las fuentes autoalojadas
    ├── App.tsx                      # renderiza HomePage
    ├── pages/
    │   ├── HomePage.tsx
    │   ├── homeCopy.ts              # textos exactos (español)
    │   └── HomePage.test.tsx        # se reemplaza (Q-02)
    ├── components/
    │   ├── RainbowStripe.tsx
    │   ├── Logo.tsx
    │   ├── StepPill.tsx
    │   ├── PrimaryButton.tsx
    │   └── Notice.tsx
    ├── hooks/
    │   └── useNotice.ts
    ├── types/
    │   ├── notice.ts                # NoticeKind
    │   └── step.ts                  # StepTone
    └── (tests junto a cada archivo: *.test.ts(x), tokens.contrast.test.ts, architecture.test.ts)
```

Se eliminan por quedar sin uso: `hooks/useHealth.ts`, `service/healthService.ts`,
`types/health.ts`.

**Structure Decision**: se mantiene la estructura por capas de `frontend/src/`; las carpetas
`service/` y `contexts/` quedan vacías (con `.gitkeep`) hasta que otra feature las necesite.

## Preguntas abiertas (a resolver antes de `/speckit-implement`)

- **Q-01**: confirmar tipografías: Montserrat (títulos y marca) y Source Sans 3 (cuerpo). Es un
  supuesto a partir del screenshot; si son otras, solo cambia el token de fuente.
- **Q-02**: **permiso explícito** para reemplazar los 2 tests actuales de `HomePage.test.tsx` (prueban
  el indicador de estado que el spec elimina) por los nuevos, y para borrar el código del indicador.
- **Q-03**: confirmar los textos de los avisos (propuesta del asistente, ver contrato).
- **Q-04**: el logo es una aproximación generada por el asistente; se puede reemplazar sin tocar
  código (mismo nombre de archivo).
- **Q-05**: `vitest-axe` (v0.1.0) declara compatibilidad con Vitest >= 0.16; se decide al implementar
  si funciona con Vitest 4. Si no, se cubre con consultas de roles/nombres de Testing Library.

## Complexity Tracking

Sin violaciones que justificar. Las decisiones de menor alcance (sin router, sin `service/` ni
`contexts/`, enlace implementado como botón) mantienen el diseño en el mínimo necesario.
