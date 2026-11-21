---

description: "Tareas para la pantalla de inicio (home) de Cuatri"
---

# Tasks: Pantalla de inicio (home) de Cuatri

**Input**: Documentos de diseño en `/specs/002-home-screen/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui-contract.md](contracts/ui-contract.md), [quickstart.md](quickstart.md)

**Tests**: INCLUIDOS. La constitución (Principio VII) exige casos felices y borde. Se usa Vitest + React Testing Library; los tests de cada historia se escriben primero y deben fallar antes de implementar.

**Organization**: Tareas agrupadas por historia de usuario del spec (US1, US2, US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede paralelizar (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1, US2, US3)
- Rutas relativas a la raíz del repo, bajo `frontend/`

## Convenciones

- Citas a `data-model.md` con su `Entidad.campo` exacto; las restricciones no se repiten aquí.
- Capas del frontend (Principio II): vista en `pages/`, piezas en `components/`, estado en `hooks/`, tipos en `types/`. Ningún componente llama a `fetch` ni importa `service/`.
- Colores y tipografías solo como tokens de `src/index.css`; ningún color hexadecimal suelto en componentes.
- Identificadores en inglés; textos de pantalla en español rioplatense, tomados de `src/pages/homeCopy.ts`.
- **Condición Q-02 (Principio VII)**: borrar o reemplazar tests existentes requiere permiso explícito del usuario. Las tareas T010, T014 y T020 no se ejecutan sin ese permiso.

---

## Phase 1: Setup

- [X] T001 Instalar con `npm` en `frontend/package.json` las fuentes autoalojadas `@fontsource-variable/montserrat` y `@fontsource-variable/source-sans-3`; actualizar `frontend/package-lock.json`
- [X] T002 [P] Actualizar `frontend/index.html`: `lang="es"`, título "Cuatri — Planificá tu cursada", meta description, favicon `/logo.svg` y `theme-color` crema
- [X] T003 [P] Definir en `frontend/src/index.css` el bloque `@theme` con todos los tokens de la sección "Tokens de estilo" de `data-model.md` (colores base, de marca y los siete pasteles con fondo, borde y texto; `--font-display` y `--font-body`) y los estilos base: fondo crema, fuente de cuerpo, anillo de foco visible de 2 px en rosa profundo con desplazamiento de 2 px, y transiciones desactivadas con `prefers-reduced-motion: reduce`
- [X] T004 Importar las dos fuentes autoalojadas en `frontend/src/main.tsx` (depende de T001)

---

## Phase 2: Foundational (bloquea todas las historias)

**Purpose**: tipos, textos y pruebas transversales que usan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta completar esta fase

- [X] T005 [P] Crear `frontend/src/types/notice.ts` con `NoticeKind` según `data-model.md` `NoticeKind`
- [X] T006 [P] Crear `frontend/src/types/step.ts` con `StepTone` según `data-model.md` `StepTone`
- [X] T007 [P] Crear `frontend/src/pages/homeCopy.ts` con los textos exactos de la tabla "Textos" de `contracts/ui-contract.md` (marca, título en dos líneas, bajada, tres pasos, botón, texto del enlace, avisos `career` y `sample`, nombre accesible del cierre y texto alternativo del logo)
- [X] T008 Escribir `frontend/src/tokens.contrast.test.ts` que lea `frontend/src/index.css`, extraiga las variables `--color-*` y verifique con la fórmula WCAG todos los pares de la tabla de contraste de `research.md` R-03 que deben cumplir (mínimo 4,5:1 para texto normal y 3:1 para texto grande, anillo de foco y borde del botón); depende de T003
- [X] T009 [P] Escribir `frontend/src/architecture.test.ts` que recorra `frontend/src/components` y `frontend/src/pages` y falle si encuentra `fetch(`, un import de `service/` o un color hexadecimal literal (research R-01 y R-07)

**Checkpoint**: `cd frontend && npm run lint && npx tsc -b && npm test` en verde antes de seguir

---

## Phase 3: User Story 1 - Entender qué es Cuatri y ver cómo empezar (Priority: P1) 🎯 MVP

**Goal**: la pantalla muestra, centrados y en orden, la franja arcoíris, el logo, el nombre, el título en dos líneas, la bajada, los tres pasos, el botón principal y el texto con el enlace; sin "Salir", sin pie de página y sin indicador de estado.

**Independent Test**: abrir el home y verificar que aparecen los textos exactos del contrato, en ese orden, y que no hay "Salir", pie ni indicador de estado.

- [X] T010 [US1] **Bloqueada por Q-02**: pedir al usuario permiso explícito para reemplazar `frontend/src/pages/HomePage.test.tsx` y borrar el código del indicador de estado; no avanzar con T014 ni T020 sin su respuesta

### Tests for User Story 1 ⚠️ (escribir primero, deben fallar)

- [X] T011 [P] [US1] Test de `StepPill` en `frontend/src/components/StepPill.test.tsx`: muestra `StepPill.number` y `StepPill.label`, aplica la clase de color según `StepPill.tone`, no es interactivo ni enfocable y el número visible tiene `aria-hidden`
- [X] T012 [P] [US1] Tests de `Logo` y `RainbowStripe` en `frontend/src/components/Logo.test.tsx` y `frontend/src/components/RainbowStripe.test.tsx`: el logo es una imagen `/logo.svg` con texto alternativo "Logo de Cuatri" y tamaño declarado; la franja es decorativa (`aria-hidden`)
- [X] T013 [P] [US1] Test de `PrimaryButton` en `frontend/src/components/PrimaryButton.test.tsx`: es un `button` de tipo `button`, muestra "+ Cargar mi primera carrera" y llama a `PrimaryButton.onClick` al activarse
- [X] T014 [US1] Reemplazar `frontend/src/pages/HomePage.test.tsx` (permiso Q-02, T010) con tests del contenido: `h1` con las dos líneas exactas, bajada, lista ordenada de tres pasos con sus textos, botón principal, texto "O explorá … para ver cómo funciona." con "un plan de ejemplo" como acción, orden del DOM del contrato, y ausencia de "Salir", de pie de página y del indicador de estado

### Implementation for User Story 1

- [X] T015 [P] [US1] Crear `frontend/src/components/RainbowStripe.tsx`: franja superior decorativa con degradado de los siete fondos pastel de los tokens, `aria-hidden`
- [X] T016 [P] [US1] Crear `frontend/src/components/Logo.tsx`: imagen `/logo.svg` con `alt` de `homeCopy.ts`, `width` y `height` de 72
- [X] T017 [P] [US1] Crear `frontend/src/components/StepPill.tsx` con las props `StepPill.number`, `StepPill.label` y `StepPill.tone`; color pastel por tono, círculo numerado con el texto principal y número `aria-hidden`
- [X] T018 [P] [US1] Crear `frontend/src/components/PrimaryButton.tsx` con la prop `PrimaryButton.onClick`: relleno rosa empolvado, texto principal, borde rosa profundo
- [X] T019 [US1] Crear `frontend/src/pages/HomePage.tsx`: composición en el orden del contrato (franja, logo, marca, `h1` con la 2ª línea en rosa profundo, bajada, `ol` de pasos, botón y párrafo con "un plan de ejemplo" como botón con aspecto de enlace); sin lógica de avisos todavía
- [X] T020 [US1] Borrar `frontend/src/hooks/useHealth.ts`, `frontend/src/service/healthService.ts` y `frontend/src/types/health.ts` (permiso Q-02, T010) y dejar `.gitkeep` en `frontend/src/service/`; confirmar que `frontend/src/App.tsx` renderiza `HomePage`
- [X] T021 [US1] Correr `cd frontend && npm run lint && npx tsc -b && npm test` y abrir `npm run dev` para revisar el contenido contra el mockup

**Checkpoint**: US1 funcional y testeable por sí sola (MVP)

---

## Phase 4: User Story 2 - Los botones no rompen la experiencia aunque el destino aún no exista (Priority: P1)

**Goal**: activar el botón principal o "un plan de ejemplo" muestra un aviso amable, único, anunciado a los lectores de pantalla, sin salir de la pantalla ni mostrar errores.

**Independent Test**: activar cada acción con mouse, teclado y toque y verificar que aparece el aviso, que se reemplaza al cambiar de acción, que no se duplica y que se cierra.

### Tests for User Story 2 ⚠️

- [X] T022 [P] [US2] Test de `useNotice` en `frontend/src/hooks/useNotice.test.ts` con la tabla de transiciones de `data-model.md` (`activeNotice` inicia en `null`; `show` reemplaza; `show` con el mismo tipo no cambia; `dismiss` limpia; nunca hay dos avisos)
- [X] T023 [P] [US2] Test de `Notice` en `frontend/src/components/Notice.test.tsx`: la región `role="status"` existe siempre, aun sin aviso; muestra el texto de `homeCopy.ts` según `Notice.kind`; el botón "Cerrar aviso" llama a `Notice.onDismiss`
- [X] T024 [P] [US2] Test de interacción en `frontend/src/pages/HomePage.notice.test.tsx` con user-event: activar el botón principal muestra el aviso `career`; activar el plan de ejemplo lo reemplaza por `sample`; repetir la misma acción no duplica; cerrar lo quita; el foco se queda en el disparador; no hay navegación ni errores

### Implementation for User Story 2

- [X] T025 [US2] Crear `frontend/src/hooks/useNotice.ts` con el estado `activeNotice` y las acciones `show` y `dismiss`, tipado con `NoticeKind` (`data-model.md` `activeNotice`), sin llamadas de red
- [X] T026 [P] [US2] Crear `frontend/src/components/Notice.tsx` con las props `Notice.kind` y `Notice.onDismiss`: contenedor `role="status"` con `aria-live="polite"` siempre en el DOM, aviso amarillo de la guía con texto `#5A4800`, botón "Cerrar aviso"
- [X] T027 [US2] Conectar en `frontend/src/pages/HomePage.tsx` el botón principal (`career`), el botón-enlace del plan de ejemplo (`sample`) y la región `Notice` a `useNotice`
- [X] T028 [US2] Correr `cd frontend && npm run lint && npx tsc -b && npm test` y probar los avisos a mano en `npm run dev`

**Checkpoint**: US1 y US2 funcionan juntas sin romperse

---

## Phase 5: User Story 3 - La pantalla es accesible y se adapta a cualquier dispositivo (Priority: P2)

**Goal**: la pantalla cumple AA, se recorre solo con teclado con foco visible y se adapta de 320 a 1920 px sin scroll horizontal.

**Independent Test**: recorrer la pantalla con Tab, medir los contrastes con el test automático y revisar los anchos y el zoom según el quickstart.

### Tests for User Story 3 ⚠️

- [X] T029 [P] [US3] Test de teclado en `frontend/src/pages/HomePage.keyboard.test.tsx`: el orden de Tab es botón principal → "un plan de ejemplo" → (con aviso) "Cerrar aviso"; los pasos no son enfocables; Enter y Espacio activan los botones
- [X] T030 [P] [US3] Test de semántica y accesibilidad en `frontend/src/pages/HomePage.a11y.test.tsx`: un solo `h1`, lista ordenada con tres ítems, botones con nombre accesible, región `status` presente y sin imágenes sin texto alternativo

### Implementation for User Story 3

- [X] T031 [US3] Evaluar `vitest-axe` (Q-05): si es compatible con Vitest 4, instalarlo en `frontend/package.json`, registrarlo en `frontend/src/test-setup.ts` y sumar la comprobación `toHaveNoViolations` a `frontend/src/pages/HomePage.a11y.test.tsx`; si no, dejar constancia en `research.md` R-07 y seguir con consultas por rol
- [X] T032 [US3] Verificar en `frontend/src/index.css` y en los componentes que todo elemento interactivo muestra el anillo de foco de T003 y que no hay transiciones con `prefers-reduced-motion`; ajustar clases si falta alguno
- [X] T033 [US3] Aplicar el comportamiento responsive de `contracts/ui-contract.md` en `frontend/src/pages/HomePage.tsx` y los componentes: mobile-first, columna centrada con `max-w-2xl` y `min-h-dvh`, título fluido con `clamp()`, pasos en `flex-wrap` centrado, anchos relativos y sin scroll horizontal
- [X] T034 [US3] Correr `cd frontend && npm run lint && npx tsc -b && npm test`, incluido `frontend/src/tokens.contrast.test.ts`

**Checkpoint**: las tres historias funcionan de forma independiente

---

## Phase 6: Polish & Cross-Cutting

- [X] T035 Correr el chequeo completo en `frontend/`: `npm run lint && npx tsc -b && npm run test:coverage && npm run build`
- [X] T036 Recorrer los escenarios 1 a 8 de `quickstart.md` en local con `npm run dev` (contenido, avisos, teclado, 320 / 360×640 / 1280×720 / 1920 px, zoom 200 %, movimiento reducido, logo caído y, si es posible, lector de pantalla)
- [X] T037 **Bloqueada por el deploy**: tras el push a `main`, repetir los escenarios 1 a 4 de `quickstart.md` en `https://cuatri.vercel.app` (escritorio y celular real) y confirmar que `https://cuatri-backend.onrender.com/health` sigue respondiendo (Principio IX); la feature no se da por terminada hasta entonces
- [ ] T038 **Opcional**: si el usuario aporta su logo, reemplazar `frontend/public/logo.svg` manteniendo el nombre y revisar el encabezado y el favicon

---

## Notas de implementación

- **Verificación con navegador real** (Edge, vía playwright-core fuera del repo): sin scroll horizontal de 320 a 1920 px; título y botón principal visibles sin desplazarse en 360×640 y 1280×720; aviso visible en 320×568, 360×640 y 1280×720; foco con anillo rosa profundo de 2 px; `transition-duration` 0 con movimiento reducido; con el logo caído quedan el texto alternativo y el nombre.
- **Ajustes surgidos de esa medición**: contenedor `max-w-3xl` y título de hasta 4 rem (con `max-w-2xl` el título se partía en 3 líneas y el botón quedaba fuera de pantalla en 1280×720); el aviso se lleva a la vista al aparecer (`scrollIntoView`), porque en 360×640 aparecía bajo el borde; al cerrar el aviso el foco vuelve al botón que lo abrió.
- **Q-05 resuelta**: `vitest-axe` 0.1.0 es compatible con Vitest 4 y está activo en `HomePage.a11y.test.tsx`.
- **T037 verificada el 2026-11-21 en `https://cuatri.vercel.app`** con Edge: HTML y assets 200, fuentes autoalojadas (sin pedidos a terceros), sin errores de consola ni pedidos fallidos, sin scroll horizontal en 320, 360, 1280 y 1920 px, botón visible sin desplazarse en 360×640, 1280×720 y 1920×1080, y flujo de avisos correcto (uno solo, reemplazo, cierre con foco al disparador); `/health` del backend sigue en 200. Detalle posterior: se agregó `scroll-mb-4` al aviso para que no quede pegado al borde inferior (requiere un nuevo push). **T038** (logo propio) es opcional y no se hizo.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; T004 depende de T001
- **Foundational (Phase 2)**: depende de Setup; T008 depende de T003; bloquea todas las historias
- **US1, US2, US3**: dependen de Foundational. US2 y US3 modifican `HomePage.tsx`, creado en US1, así que se hacen **en orden** US1 → US2 → US3
- **Polish**: depende de las tres historias; T037 depende además del push y del deploy

### Dentro de cada historia

- Tests primero (deben fallar), luego componentes, página y conexión
- T014, T020 y T010 dependen del permiso Q-02; T019 depende de T015 a T018 y de T007; T027 depende de T019, T025 y T026

### Parallel Opportunities

- Setup: T002 y T003 en paralelo tras T001
- Foundational: T005, T006, T007 y T009 en paralelo
- US1: T011 a T013 en paralelo; T015 a T018 en paralelo
- US2: T022 a T024 en paralelo; US3: T029 y T030 en paralelo

## Parallel Example: User Story 1

```text
# Tests de US1 juntos:
T011 StepPill.test.tsx   T012 Logo.test.tsx + RainbowStripe.test.tsx   T013 PrimaryButton.test.tsx

# Componentes en paralelo:
T015 RainbowStripe.tsx   T016 Logo.tsx   T017 StepPill.tsx   T018 PrimaryButton.tsx
```

## Implementation Strategy

### MVP First (solo US1)

1. Setup → Foundational → US1.
2. **Detenerse y validar** con `npm run dev` contra el mockup.
3. Sumar US2 (avisos) y US3 (accesibilidad y responsive).

### Notas

- US1 y US2 son ambas P1: un home cuyos botones no responden rompe la confianza, así que no conviene publicar US1 sin US2.
- Si el usuario no concede el permiso Q-02, se conserva `HomePage.test.tsx` y el código del indicador, y el home se construye en archivos nuevos hasta que se resuelva.
- El usuario es quien commitea; el asistente solo propone el nombre de commit.
