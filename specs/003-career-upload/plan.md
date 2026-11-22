# Implementation Plan: Cargar la carrera (subir el plan y revisar las materias)

**Branch**: `003-career-upload` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-career-upload/spec.md`

## Summary

Una pantalla nueva (`/cargar-carrera`) donde la persona elige o arrastra el reporte de su plan
(PDF o `.xls`), lo analiza con el servicio de extracción que ya existe (feature 001) y revisa el
resultado: resumen, materias agrupadas por módulo, datos "sin determinar" y aviso de que no se
guarda. El botón del home pasa a navegar hacia esta pantalla y se retira el aviso de "próximamente".

Enfoque técnico: **solo frontend, el backend no cambia**. React 19 + Tailwind 4 con los tokens ya
definidos, `react-router` para la navegación, capa `service/` con la única llamada de red, un hook
con la máquina de estados (idle → selected → analyzing → success | error) y temporizadores de 10 s
(aviso de demora) y 60 s (límite), y componentes sin red. Detalle en [research.md](research.md),
[data-model.md](data-model.md) y [contracts/](contracts/).

**Hallazgos del análisis**:
- El backend gratuito de Render se duerme y tarda cerca de un minuto en despertar: por eso la
  pantalla dispara un `GET /health` al entrar (warm-up) mientras la persona elige el archivo.
- Si el navegador suelta un archivo fuera del área, por defecto lo abre y abandona la app: hay que
  frenarlo a nivel de ventana (caso borde del spec).
- Los créditos y las notas llegan como texto (`"10.00"`, `"9"`): se formatean para mostrar.
- El aviso de "próximamente" del home deja de existir: cambia la feature 002 (FR-009 y FR-010) y
  obliga a tocar tests existentes (condición Q-02).

## Technical Context

**Language/Version**: TypeScript ~7.0 sobre React 19.3

**Primary Dependencies**: Vite 8, Tailwind CSS 4.3, React Testing Library 16, user-event 14 y
`vitest-axe` (existentes); nueva: `react-router` 8.5.x (peer React >= 19.2.7; API a verificar al
instalar porque la versión es muy reciente)

**Storage**: N/A. Nada se persiste: sin `localStorage`, `sessionStorage` ni caché del archivo o del
resultado

**Testing**: Vitest 4 + jsdom + React Testing Library; `fetch` simulado y temporizadores falsos. El
layout, el arrastre real y el foco visible se verifican con un navegador real (Edge vía
`playwright-core` fuera del repo) y contra el deploy

**Target Platform**: navegadores modernos de escritorio y celular; Vercel (frontend) contra el
backend de Render

**Project Type**: web-service, solo `frontend/`

**Performance Goals**: SC-006 (sin scroll horizontal de 320 a 1920 px con 60+ materias); un solo
envío por análisis (SC-008); aviso de demora a los 10 s y límite a los 60 s

**Constraints**: AA de contraste, solo tokens de la guía, español rioplatense, sin datos personales en
pantalla, sin guardar nada; todo operable con teclado

**Scale/Scope**: 1 pantalla nueva, 1 servicio, 2 hooks, ~10 componentes, 2 rutas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|-----------|--------|-------|
| I. Capas backend | N/A | El backend no se toca. |
| II. Capas frontend | PASS | `service/` es la única capa con red; `hooks/` la invoca; `components/` y `pages/` no usan `fetch` ni importan `service/` (lo verifica el test de arquitectura existente); `types/` aparte; `contexts/` sin uso (el resultado vive en el hook de la página y no se comparte). |
| III. Estados derivados | N/A | No hay materias persistidas; el estado que se muestra es el del archivo. |
| IV. Reglas extensibles | N/A | Las correlativas se muestran como "sin determinar". |
| V. Auth opcional | PASS | Sin cuenta ni sesión. |
| VI. Validación por nivel | PASS | Forma del archivo (formato, tamaño, vacío) en el hook antes de enviar; la existencia y el contenido los valida el servicio; los errores del servicio se traducen sin reinterpretarlos. |
| VII. Testing | **PASS con una condición** | El cambio del home obliga a modificar o borrar tests existentes (Notice, useNotice y los del home). Requiere permiso explícito antes de implementar (Q-02). |
| VIII. OpenAPI automática | N/A | No cambia la API. |
| IX. Definición de terminado | **BLOQUEADO hasta el deploy** | Hay que verificar la pantalla en `https://cuatri.vercel.app`, incluida una subida real contra el backend de Render. |
| X. Idioma | PASS | Identificadores en inglés; textos en español rioplatense; la ruta `/cargar-carrera` es texto visible para la persona. |
| XI. Spec-first | PASS | Spec 003 aprobado y sin marcadores. Falta actualizar el spec 002 (FR-009/FR-010) antes de tocar el home (tarea del plan). |

**Post-diseño**: igual. Quedan Q-02 (permiso sobre tests) y el gate IX (deploy).

## Project Structure

### Documentation (this feature)

```text
specs/003-career-upload/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api-consumption.md   # cómo se consume POST /planes/extraccion y /health
│   └── ui-contract.md       # textos, estados, regiones, foco, responsive
└── tasks.md                 # lo genera /speckit-tasks
```

### Source Code (repository root)

```text
frontend/src/
├── main.tsx                        # + BrowserRouter
├── App.tsx                         # rutas "/" y "/cargar-carrera"
├── config.ts                       # API_URL, MAX_UPLOAD_BYTES (10 MB), tiempos (10 s / 60 s)
├── service/
│   └── planService.ts              # extractPlan(file, signal), warmUp()
├── types/
│   ├── plan.ts                     # espejo del contrato de la feature 001
│   └── extraction.ts               # ExtractionErrorCode, ExtractionState
├── hooks/
│   ├── usePlanExtraction.ts        # máquina de estados + temporizadores + validación
│   └── useWarmUp.ts                # GET /health al entrar
├── components/
│   ├── ButtonLink.tsx              # enlace con el estilo del botón principal
│   ├── FileDropzone.tsx            # botón + arrastrar y soltar (+ elección entre varios)
│   ├── SelectedFile.tsx
│   ├── AnalyzingStatus.tsx
│   ├── ResultSummary.tsx
│   ├── ModuleSection.tsx
│   ├── SubjectItem.tsx
│   ├── UndeterminedNote.tsx
│   ├── ReviewNotice.tsx
│   └── ErrorMessage.tsx
├── pages/
│   ├── CareerUploadPage.tsx
│   ├── careerUploadCopy.ts         # textos exactos
│   └── HomePage.tsx                # el botón pasa a ser ButtonLink; sin aviso
├── utils/                          # formatCredits, formatFileSize, groupByModule, validateFile
├── test-fixtures/                  # JSON de la muestra sintética (sin datos personales)
└── (tests junto a cada archivo)
```

Se eliminan por quedar sin uso: `components/Notice.tsx`, `hooks/useNotice.ts`, `types/notice.ts` y sus
tests, además de los textos de aviso en `pages/homeCopy.ts`.

**Structure Decision**: se mantiene la estructura por capas de `frontend/src/`. `utils/` agrupa
funciones puras sin red ni React (formato y agrupación); no es una capa nueva de la constitución,
sino helpers de las capas existentes.

## Preguntas abiertas (a resolver antes de `/speckit-implement`)

- **Q-01**: confirmar la ruta `/cargar-carrera`.
- **Q-02**: **permiso explícito** para modificar o borrar los tests existentes del home y borrar
  `Notice`, `useNotice` y `types/notice.ts` (Principio VII), y actualizar el spec 002.
- **Q-03**: confirmar los textos amables de errores y de demora (propuesta en
  [contracts/ui-contract.md](contracts/ui-contract.md)).
- **Q-04**: los 10 s y 60 s son supuestos; el arranque en frío puede acercarse a 60 s, por eso el
  warm-up.
- **Q-05**: aceptar la dependencia `react-router` (la alternativa es un router propio mínimo).
- **Q-06**: `MAX_UPLOAD_BYTES` queda duplicado en front y back (10 MB); si cambia en el backend hay
  que actualizar el front.
- **Q-07**: CORS: las vistas previas de Vercel (otro dominio) y el desarrollo local contra el backend
  de Render requieren sumar esos orígenes a `CORS_ORIGINS`.

## Complexity Tracking

Sin violaciones que justificar. La dependencia `react-router` y la carpeta `utils/` son la parte
menos mínima del diseño y se justifican en research R-01 y R-08.
