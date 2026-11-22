---

description: "Tareas para cargar la carrera (subir el plan y revisar las materias)"
---

# Tasks: Cargar la carrera (subir el plan y revisar las materias)

**Input**: Documentos de diseño en `/specs/003-career-upload/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api-consumption.md](contracts/api-consumption.md), [contracts/ui-contract.md](contracts/ui-contract.md), [quickstart.md](quickstart.md)

**Tests**: INCLUIDOS. La constitución (Principio VII) exige casos felices y borde. Se usa Vitest + React Testing Library; los tests de cada historia se escriben primero y deben fallar antes de implementar.

**Organization**: Tareas agrupadas por historia de usuario del spec (US1 a US4).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede paralelizar (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1 a US4)
- Rutas relativas a la raíz del repo, bajo `frontend/` salvo que se indique otra cosa

## Convenciones

- Citas a `data-model.md` con su `Entidad.campo` exacto; las restricciones no se repiten aquí.
- Capas del frontend (Principio II): red solo en `service/`; `hooks/` la invoca; `components/` y `pages/` nunca usan `fetch` ni importan `service/`; `utils/` son funciones puras sin red ni React.
- Colores y tipografías solo como tokens de `src/index.css`; ningún color hexadecimal suelto en componentes. Textos solo desde `src/pages/careerUploadCopy.ts`.
- No se guarda nada: sin `localStorage`, `sessionStorage` ni `console` con datos del archivo o del resultado.
- **Condición Q-02 (Principio VII)**: modificar o borrar tests existentes requiere permiso explícito del usuario. Las tareas T007, T028 y T039 no se ejecutan sin ese permiso.
- **Spec-first (Principio XI)**: antes de tocar el home se actualiza el spec 002 (T006).
- Ruta tentativa `/cargar-carrera` (Q-01) y dependencia `react-router` (Q-05): se confirman antes de implementar.

---

## Phase 1: Setup

- [X] T001 Instalar `react-router` con `npm` en `frontend/package.json` (actualizar `frontend/package-lock.json`) y confirmar que `BrowserRouter`, `Routes`, `Route`, `Link` y `useNavigate` mantienen la forma esperada (research R-01); si la API cambió, ajustar las tareas siguientes sin cambiar el diseño
- [X] T002 [P] Crear `frontend/src/config.ts` con las constantes de la sección "Constantes" de `data-model.md`: `MAX_UPLOAD_BYTES`, `ACCEPTED_EXTENSIONS`, `SLOW_AFTER_MS`, `ABORT_AFTER_MS` y `API_URL` (de `VITE_API_URL`, sin `/` final, con `http://localhost:8000` por defecto)
- [X] T003 [P] Crear `frontend/src/types/plan.ts` con los tipos de la API según `data-model.md` `PlanInfo.program`, `PlanInfo.plan`, `PlanInfo.version`, `Requisito.kind`, `Estado.kind`, `Estado.grade`, `Estado.condition`, `Estado.text`, `Materia.name`, `Materia.code`, `Materia.credits`, `Materia.group`, `Materia.is_elective`, `Materia.year`, `Materia.prerequisites`, `Materia.status` y `ExtractionResult.subjects` (los decimales como texto)
- [X] T004 [P] Crear `frontend/src/types/extraction.ts` con `ExtractionErrorCode` y el estado de la pantalla (`idle`, `selected`, `analyzing`, `success`, `error`) según `data-model.md` `ExtractionErrorCode`, `selected.file`, `analyzing.slow` y `error.canRetry`
- [X] T005 [P] Generar con un script de una sola vez (fuera del repo, usando el backend: `uv run python` sobre `backend/tests/fixtures/plan_sintetico.pdf`) el JSON de respuesta de la muestra sintética y guardarlo en `frontend/src/test-fixtures/extraction-sample.json` (14 materias, sin datos personales); sumar una variante `extraction-large.json` con 61 materias sintéticas repartidas en 8 módulos, incluido uno de otra propuesta y uno sin módulo
- [X] T006 [P] Actualizar `specs/002-home-screen/spec.md` y sus documentos (`contracts/ui-contract.md`, `data-model.md`, `research.md`, `plan.md`): el botón "+ Cargar mi primera carrera" pasa a ser un enlace a la pantalla de carga y el aviso de "próximamente" desaparece (FR-009, FR-010, US2, SC-006 y Assumptions), con la decisión registrada en *Clarifications*

---

## Phase 2: Foundational (bloquea todas las historias)

**Purpose**: permiso, utilidades puras, servicio, rutas, textos y pruebas transversales

**⚠️ CRITICAL**: ninguna historia puede empezar hasta completar esta fase

- [X] T007 **Bloqueada por Q-02**: pedir al usuario permiso explícito para modificar o borrar los tests existentes del home y borrar `Notice`, `useNotice` y `types/notice.ts`; no avanzar con T028 ni T039 sin su respuesta
- [X] T008 [P] Tests de `validateFile` en `frontend/src/utils/validateFile.test.ts`: vacío → `empty_file`; supera `MAX_UPLOAD_BYTES` → `file_too_large`; extensión fuera de `ACCEPTED_EXTENSIONS` (sin distinguir mayúsculas) → `invalid_file`; tamaño exacto del máximo y archivos válidos → `null` (según `data-model.md` `validateFile`)
- [X] T009 [P] Tests de `groupByModule` y `countApproved` en `frontend/src/utils/groupByModule.test.ts`: orden de primera aparición, "Sin módulo" para `Materia.group` nulo, conteo de aprobadas por `Estado.kind`, y que la suma de los módulos coincide con el total
- [X] T010 [P] Tests de `formatCredits` y `formatFileSize` en `frontend/src/utils/format.test.ts`: `"10.00"` → `10`, `"4.50"` → `4,5`, `null` → `sin dato`; tamaños en B, KB y MB
- [X] T011 [P] Implementar `validateFile` en `frontend/src/utils/validateFile.ts` usando las constantes de `frontend/src/config.ts`
- [X] T012 [P] Implementar `groupByModule` y `countApproved` en `frontend/src/utils/groupByModule.ts`
- [X] T013 [P] Implementar `formatCredits` y `formatFileSize` en `frontend/src/utils/format.ts`
- [X] T014 [P] Tests del servicio en `frontend/src/service/planService.test.ts` con `fetch` simulado: `extractPlan` envía `FormData` con el campo `file` sin fijar `Content-Type`, devuelve el resultado tipado, traduce cada fila de la tabla de errores de `contracts/api-consumption.md` (`empty_file`, `file_too_large`, `invalid_file`, `no_subjects_found`, `validation_error` → `invalid_file`, 5xx, 429, cuerpo no JSON, red caída y aborto → `service_unavailable`); `warmUp` llama a `GET /health` y nunca lanza error
- [X] T015 Implementar `frontend/src/service/planService.ts` con `extractPlan(file, signal)` y `warmUp()` según `contracts/api-consumption.md`, usando `API_URL` de `frontend/src/config.ts`; sin registrar ni guardar nada del archivo (depende de T002, T003, T004)
- [X] T016 Configurar las rutas: envolver la app con `BrowserRouter` en `frontend/src/main.tsx` y definir `/` (HomePage) y `/cargar-carrera` (`CareerUploadPage`, con un marcador mínimo hasta US1) en `frontend/src/App.tsx`; confirmar que el acceso directo y la recarga funcionan con `frontend/vercel.json`
- [X] T017 [P] Crear `frontend/src/pages/careerUploadCopy.ts` con todos los textos de las tablas "Textos" y "Errores" de `contracts/ui-contract.md`
- [X] T018 [P] Extender `frontend/src/tokens.contrast.test.ts` con los pares nuevos de la tabla de `research.md` R-09 (texto y secundario sobre blanco, rosa profundo sobre blanco, borde de control sobre crema y blanco, chips violeta y verde, error, aviso de revisión)
- [X] T019 [P] Extender `frontend/src/architecture.test.ts` para que también recorra `frontend/src/hooks` y `frontend/src/utils` y falle ante `localStorage`, `sessionStorage` o `console.` (Principio II y research R-10)

**Checkpoint**: `cd frontend && npm run lint && npx tsc -b && npm test` en verde antes de seguir

---

## Phase 3: User Story 1 - Subir el plan y ver las materias detectadas (Priority: P1) 🎯 MVP

**Goal**: desde el inicio la persona llega a `/cargar-carrera`, elige un archivo, lo analiza y ve el resumen y las materias agrupadas por módulo, con "sin determinar" y el aviso de que no se guarda.

**Independent Test**: tocar el botón del inicio, elegir la muestra sintética (PDF y `.xls`), analizar y verificar el resumen (14 materias, 6 aprobadas), los módulos con sus materias, los datos "sin determinar", el aviso de revisión y las acciones finales.

### Tests for User Story 1 ⚠️ (escribir primero, deben fallar)

- [X] T020 [P] [US1] Test de `usePlanExtraction` (camino feliz) en `frontend/src/hooks/usePlanExtraction.test.ts`: `idle` → `selected` al elegir un archivo válido → `analyzing` → `success` con el resultado; reiniciar vuelve a `idle`; un segundo "analizar" durante `analyzing` no envía otra petición (servicio simulado)
- [X] T021 [P] [US1] Test de `ButtonLink` en `frontend/src/components/ButtonLink.test.tsx` con `MemoryRouter`: es un enlace con el destino indicado y el estilo del botón principal
- [X] T022 [P] [US1] Test de `SelectedFile` en `frontend/src/components/SelectedFile.test.tsx`: muestra nombre y tamaño legible y un "Cambiar archivo" que abre el selector
- [X] T023 [P] [US1] Test de `FileDropzone` (camino con botón) en `frontend/src/components/FileDropzone.test.tsx`: "Elegir archivo" abre el selector, el input solo acepta PDF y Excel y el archivo elegido se informa a quien lo usa
- [X] T024 [P] [US1] Test de `AnalyzingStatus` en `frontend/src/components/AnalyzingStatus.test.tsx`: muestra "Analizando tu plan…" con el spinner decorativo oculto a los lectores de pantalla
- [X] T025 [P] [US1] Tests de `ResultSummary`, `UndeterminedNote` y `ReviewNotice` en `frontend/src/components/ResultSummary.test.tsx`, `frontend/src/components/UndeterminedNote.test.tsx` y `frontend/src/components/ReviewNotice.test.tsx`: resumen con carrera, plan y versión solo si existen (`PlanInfo.program`, `PlanInfo.plan`, `PlanInfo.version`), cantidad de materias y aprobadas, nota de "sin determinar" y aviso de que no se guarda
- [X] T026 [P] [US1] Tests de `ModuleSection` y `SubjectItem` en `frontend/src/components/ModuleSection.test.tsx` y `frontend/src/components/SubjectItem.test.tsx`: `h3` con nombre y cantidad del módulo, "Sin módulo", lista `ul`; cada materia muestra `Materia.code`, `Materia.name`, créditos formateados y "sin dato" si faltan, chip de optativa por `Materia.is_elective` y chip de estado por `Materia.status` (aprobada con nota, en curso, estado literal, "Sin estado")
- [X] T027 [US1] Test de flujo de la página en `frontend/src/pages/CareerUploadPage.test.tsx` con `MemoryRouter` y el fixture de T005: elegir archivo, analizar, resumen, módulos agrupados con los de otra propuesta, "sin determinar", aviso de revisión, acciones "Cargar otro archivo" y "Volver al inicio", foco en el título del resultado y región de estado con el anuncio
- [X] T028 [US1] **Bloqueada por Q-02**: actualizar los tests del inicio: `frontend/src/pages/HomePage.test.tsx`, `frontend/src/pages/HomePage.keyboard.test.tsx` y `frontend/src/pages/HomePage.a11y.test.tsx` (el botón principal ahora es un enlace a `/cargar-carrera`, ya no hay región de aviso ni segundo botón) y borrar `frontend/src/pages/HomePage.notice.test.tsx`, `frontend/src/components/Notice.test.tsx` y `frontend/src/hooks/useNotice.test.ts`

### Implementation for User Story 1

- [X] T029 [US1] Implementar `frontend/src/hooks/usePlanExtraction.ts` con el estado `idle`/`selected`/`analyzing`/`success`, la elección de archivo, "analizar" con un solo envío, y el reinicio (según `data-model.md` `selected.file` y la tabla de transiciones); la validación, los temporizadores y el reintento se agregan en US2
- [X] T030 [P] [US1] Implementar `frontend/src/hooks/useWarmUp.ts`: dispara `warmUp()` una sola vez al montar la pantalla y no muestra nada
- [X] T031 [P] [US1] Crear `frontend/src/components/buttonStyles.ts` con las clases del botón principal y `frontend/src/components/ButtonLink.tsx` (enlace de `react-router` con ese estilo); refactorizar `frontend/src/components/PrimaryButton.tsx` para usar la misma constante
- [X] T032 [P] [US1] Implementar `frontend/src/components/SelectedFile.tsx` (nombre, tamaño con `formatFileSize`, "Cambiar archivo")
- [X] T033 [P] [US1] Implementar `frontend/src/components/FileDropzone.tsx` con el botón "Elegir archivo" y un `input type="file"` oculto con `accept` de PDF y Excel (el arrastre se agrega en US3)
- [X] T034 [P] [US1] Implementar `frontend/src/components/AnalyzingStatus.tsx` con el texto, el spinner decorativo (`aria-hidden`) y `aria-busy`
- [X] T035 [P] [US1] Implementar `frontend/src/components/ResultSummary.tsx`, `frontend/src/components/UndeterminedNote.tsx` y `frontend/src/components/ReviewNotice.tsx` con los textos de `careerUploadCopy.ts`
- [X] T036 [P] [US1] Implementar `frontend/src/components/SubjectItem.tsx` mostrando `Materia.code` (o "sin dato"), `Materia.name`, créditos con `formatCredits`, chip violeta por `Materia.is_elective` y chip de estado según `Materia.status`, como tarjeta apilada
- [X] T037 [US1] Implementar `frontend/src/components/ModuleSection.tsx` (`section` con `h3` y lista `ul`) usando `SubjectItem` (depende de T036)
- [X] T038 [US1] Implementar `frontend/src/pages/CareerUploadPage.tsx`: título, explicación, `FileDropzone`, `SelectedFile`, "Analizar mi plan" con `PrimaryButton`, `AnalyzingStatus`, resultado (`h2` con `tabIndex={-1}` que recibe el foco, resumen, notas, módulos con `groupByModule`, acciones), región `role="status"` siempre presente y `useWarmUp` (depende de T029 a T037 y T017)
- [X] T039 [US1] **Bloqueada por Q-02**: en `frontend/src/pages/HomePage.tsx` reemplazar el botón principal por `ButtonLink` hacia `/cargar-carrera` y quitar el aviso; borrar `frontend/src/components/Notice.tsx`, `frontend/src/hooks/useNotice.ts` y `frontend/src/types/notice.ts`; quitar los textos de aviso de `frontend/src/pages/homeCopy.ts`
- [X] T040 [US1] Correr `cd frontend && npm run lint && npx tsc -b && npm test` y abrir `npm run dev` para recorrer el flujo contra el backend local con `plan_sintetico.pdf` y `.xls`

**Checkpoint**: US1 funcional y testeable por sí sola (MVP)

---

## Phase 4: User Story 2 - Errores claros y forma de reintentar (Priority: P1)

**Goal**: cada causa de error tiene su mensaje, los problemas de formato y tamaño se avisan antes de enviar, hay aviso de demora a los 10 s y límite a los 60 s, y se puede reintentar.

**Independent Test**: elegir un `.png`, un archivo de más de 10 MB, uno vacío, un PDF sin materias y cortar la conexión durante el análisis, y verificar el mensaje propio de cada caso y las acciones disponibles.

### Tests for User Story 2 ⚠️

- [X] T041 [P] [US2] Tests del hook en `frontend/src/hooks/usePlanExtraction.errors.test.ts` con temporizadores simulados: validación previa con `validateFile` sin enviar; cada `ExtractionErrorCode` del servicio lleva a `error`; `analyzing.slow` pasa a `true` a `SLOW_AFTER_MS`; aborto a `ABORT_AFTER_MS` → `service_unavailable`; `error.canRetry` solo con `service_unavailable`; reintento con el mismo archivo; limpieza y aborto al desmontar
- [X] T042 [P] [US2] Test de `ErrorMessage` en `frontend/src/components/ErrorMessage.test.tsx`: un mensaje distinto por causa, `role="alert"`, acciones "Elegir otro archivo" y, solo con `error.canRetry`, "Reintentar"
- [X] T043 [US2] Test de la página en `frontend/src/pages/CareerUploadPage.errors.test.tsx`: aviso previo para formato, tamaño y vacío sin llamar al servicio; cada causa del servicio con su mensaje; reintento; "Elegir otro archivo"; aviso de demora a los 10 s; error de servicio a los 60 s; foco en el mensaje de error

### Implementation for User Story 2

- [X] T044 [US2] Completar `frontend/src/hooks/usePlanExtraction.ts`: validación previa con `validateFile`, estado `error` con `error.code` y `error.canRetry`, `analyzing.slow` a `SLOW_AFTER_MS`, `AbortController` con aborto a `ABORT_AFTER_MS`, reintento, reinicio, un solo envío y limpieza al desmontar
- [X] T045 [P] [US2] Implementar `frontend/src/components/ErrorMessage.tsx` con los mensajes de `careerUploadCopy.ts`, `role="alert"` y las acciones según `error.canRetry`
- [X] T046 [US2] Conectar en `frontend/src/pages/CareerUploadPage.tsx` el estado de error (con foco en el contenedor del mensaje), el aviso de demora en `AnalyzingStatus` y las acciones de reintentar y elegir otro archivo
- [X] T047 [US2] Correr `cd frontend && npm run lint && npx tsc -b && npm test` y probar a mano los errores contra el backend local (imagen `.pdf`, PDF sin materias, backend apagado)

**Checkpoint**: US1 y US2 funcionan juntas sin romperse

---

## Phase 5: User Story 3 - Arrastrar el archivo como comodidad (Priority: P2)

**Goal**: en computadora se puede arrastrar el archivo sobre el área de carga, con el mismo resultado que el botón; se contempla soltar varios archivos y soltar fuera del área.

**Independent Test**: arrastrar un archivo válido, uno inválido y varios a la vez, y soltar fuera del área, verificando que el comportamiento coincide con el del botón y que la app no se abandona.

### Tests for User Story 3 ⚠️

- [X] T048 [P] [US3] Tests de arrastre en `frontend/src/components/FileDropzone.drag.test.tsx`: estado visual "Soltá el archivo acá" al arrastrar sobre el área y al salir; soltar un archivo válido se comporta como elegirlo; uno inválido muestra el mismo aviso previo; varios archivos muestran "Soltaste {n} archivos…" con un botón por archivo; soltar algo que no es un archivo no hace nada
- [X] T049 [P] [US3] Test de `useBlockWindowDrop` en `frontend/src/hooks/useBlockWindowDrop.test.ts`: mientras está montado cancela el comportamiento por defecto de `dragover` y `drop` en la ventana y lo restablece al desmontar

### Implementation for User Story 3

- [X] T050 [US3] Completar `frontend/src/components/FileDropzone.tsx` con `dragenter`, `dragover`, `dragleave` y `drop` (contador para no parpadear), estado visual de arrastre y la lista para elegir cuando se sueltan varios archivos; todo sigue alcanzable con el botón y con teclado
- [X] T051 [P] [US3] Implementar `frontend/src/hooks/useBlockWindowDrop.ts` (research R-06)
- [X] T052 [US3] Usar `useBlockWindowDrop` en `frontend/src/pages/CareerUploadPage.tsx` y correr `cd frontend && npm run lint && npx tsc -b && npm test`

**Checkpoint**: US3 agrega arrastre sin afectar las historias anteriores

---

## Phase 6: User Story 4 - Pantalla accesible, privada y legible aun con muchas materias (Priority: P2)

**Goal**: la pantalla cumple AA, se opera con teclado, anuncia los cambios de estado, es legible con 60+ materias de 320 a 1920 px y nunca muestra datos personales.

**Independent Test**: revisar la pantalla con el fixture de 61 materias de 320 a 1920 px y con zoom 200 %, recorrerla con Tab, correr los tests de accesibilidad y verificar que ningún dato personal aparece.

### Tests for User Story 4 ⚠️

- [X] T053 [P] [US4] Test de accesibilidad en `frontend/src/pages/CareerUploadPage.a11y.test.tsx` con `vitest-axe`: sin violaciones en `idle`, `selected`, `analyzing`, `success` y `error`; un solo `h1`; una `section` con `h3` por módulo; la región `status` presente en todo momento
- [X] T054 [P] [US4] Test de teclado y foco en `frontend/src/pages/CareerUploadPage.keyboard.test.tsx`: orden de Tab "Elegir archivo" → "Cambiar archivo" → "Analizar mi plan" → "Cargar otro archivo" → "Volver al inicio"; el foco va a "Analizar mi plan" al elegir un archivo, al título del resultado al terminar, al mensaje en un error y a "Elegir archivo" con "Cargar otro archivo"
- [X] T055 [P] [US4] Test de privacidad en `frontend/src/pages/CareerUploadPage.privacy.test.tsx`: con una respuesta que incluye campos extra (`student`, `legajo`, `Alumno`) la pantalla no los muestra; no se escribe nada en `localStorage` ni `sessionStorage`; recargar vuelve al estado inicial

### Implementation for User Story 4

- [X] T056 [US4] Aplicar el comportamiento responsive de `contracts/ui-contract.md` en `frontend/src/pages/CareerUploadPage.tsx` y los componentes: mobile-first, contenido centrado con ancho de lectura, materias como tarjetas apiladas que pasan a fila en pantallas anchas, sin tablas ni anchos fijos, spinner detenido con `prefers-reduced-motion` y foco visible en todo control
- [X] T057 [US4] Verificar con un navegador real (Edge vía `playwright-core`, fuera del repo) interceptando `POST /planes/extraccion` con `extraction-large.json` (61 materias): sin scroll horizontal en 320, 360, 1280 y 1920 px y con zoom 200 %, foco visible, arrastre real con un archivo, y capturas de cada estado
- [X] T058 [US4] Correr `cd frontend && npm run lint && npx tsc -b && npm test`, incluidos `frontend/src/tokens.contrast.test.ts` y `frontend/src/architecture.test.ts`

**Checkpoint**: las cuatro historias funcionan de forma independiente

---

## Phase 7: Polish & Cross-Cutting

- [X] T059 [P] Actualizar `README.md` con la nueva pantalla `/cargar-carrera`, el uso de `VITE_API_URL` y la nota de CORS para desarrollo local contra Render
- [X] T060 Correr el chequeo completo en `frontend/`: `npm run lint && npx tsc -b && npm run test:coverage && npm run build`
- [X] T061 Recorrer los escenarios 1 a 12 de `quickstart.md` en local con `npm run dev` y el backend local, incluida la muestra real (opcional) sin que aparezcan nombre ni legajo
- [ ] T062 **Acción del usuario (Q-07)**: si se quiere usar vistas previas de Vercel o probar en local contra Render, sumar esos orígenes a `CORS_ORIGINS` en Render
- [ ] T063 **Bloqueada por el deploy**: tras el push a `main`, repetir en `https://cuatri.vercel.app` los escenarios 1, 2, 3, 5, 6, 7 y 11 de `quickstart.md` con los archivos sintéticos, confirmar la subida real contra `https://cuatri-backend.onrender.com` sin errores de CORS y el comportamiento con el backend dormido (Principio IX); la feature no se da por terminada hasta entonces

---

## Notas de implementación

- **react-router**: `npm` instaló la 7.18.x (la etiqueta estable); expone `BrowserRouter`, `Routes`, `Route`, `Link`, `useNavigate` y `MemoryRouter` como se esperaba (T001).
- **Tests**: 36 archivos y 333 tests antes del cambio del home. Hallazgo: `beforeEach(() => mock.mockClear())` devuelve el mock y Vitest lo llama como limpieza (promesa rechazada sin manejar); se usan llaves. Con muchos archivos, los workers de Vitest a veces no arrancan por carga de la máquina: `maxWorkers: 3` en `vite.config.ts` lo reduce.
- **Verificado en Edge** (vía `playwright-core`, fuera del repo) con el fixture de 61 materias en 8 módulos: sin scroll horizontal a 320, 360×640, 640×360 (zoom 200 %), 1280 y 1920 px; foco en "Analizar mi plan" tras elegir y en el título del resultado al terminar; arrastre real (estado visual, soltar, varios archivos, soltar fuera del área cancelado); error 422 con foco en la alerta. Ajustes: chips sin salto de línea y sin recuadro de foco en el `h2` del resultado.
- **De punta a punta con el backend real local**: PDF y `.xls` sintéticos dan el mismo resultado (14 materias, 6 aprobadas, 5 módulos), sin datos del alumno; una imagen `.pdf` da el mensaje de archivo inválido; nada en `localStorage` ni `sessionStorage`.
- **Q-02 concedido por el usuario**: se adaptaron `HomePage.test.tsx`, `HomePage.keyboard.test.tsx` y `HomePage.a11y.test.tsx`, se borraron `HomePage.notice.test.tsx`, `Notice.test.tsx`, `useNotice.test.ts`, `Notice.tsx`, `useNotice.ts` y `types/notice.ts`, y se agregó `HomePage.navigation.test.tsx`. El botón del inicio es un enlace real a `/cargar-carrera`.
- **Resultado final**: 34 archivos y 312 tests en verde, cobertura 98 % de líneas, lint, tipos y build. En el build de producción (`vite preview`): clic, recarga y acceso directo a `/cargar-carrera` funcionan, y el clic del medio abre una pestaña nueva.
- **Pendientes**: T062 (acción del usuario: CORS en Render si se quieren vistas previas o probar en local contra Render) y T063 (verificación en el deploy, tras el push).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; T006 (spec 002) antes de T039 (Principio XI)
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias. T011 a T013 dependen de sus tests (T008 a T010) y de T002 a T004; T015 de T014; T016 de T001
- **US1 → US2 → US3 → US4**: US2 completa archivos creados en US1 (`usePlanExtraction.ts`, `CareerUploadPage.tsx`), US3 completa `FileDropzone.tsx` y US4 refina la página; se hacen **en orden**
- **Polish**: depende de las cuatro historias; T063 depende además del push y del deploy

### Dentro de cada historia

- Tests primero (deben fallar), luego hooks, componentes y página
- T007, T028 y T039 dependen del permiso Q-02; T038 depende de T029 a T037; T037 de T036

### Parallel Opportunities

- Setup: T002 a T006 en paralelo tras T001
- Foundational: T008 a T010 en paralelo; luego T011 a T013 en paralelo; T017 a T019 en paralelo
- US1: T020 a T026 en paralelo; T030 a T036 en paralelo
- US2: T041 y T042 en paralelo; US3: T048 y T049 en paralelo; US4: T053 a T055 en paralelo

## Parallel Example: User Story 1

```text
# Tests de US1 juntos:
T020 usePlanExtraction.test.ts   T021 ButtonLink.test.tsx   T022 SelectedFile.test.tsx
T023 FileDropzone.test.tsx       T024 AnalyzingStatus.test.tsx
T025 ResultSummary/UndeterminedNote/ReviewNotice tests   T026 ModuleSection/SubjectItem tests

# Componentes en paralelo:
T031 ButtonLink.tsx   T032 SelectedFile.tsx   T033 FileDropzone.tsx   T034 AnalyzingStatus.tsx
T035 ResultSummary.tsx + UndeterminedNote.tsx + ReviewNotice.tsx   T036 SubjectItem.tsx
```

## Implementation Strategy

### MVP First (US1 + US2)

1. Setup → Foundational → US1.
2. **Detenerse y validar** con las muestras sintéticas contra el backend local.
3. Sumar US2 antes de publicar: sin errores claros, un archivo malo deja a la persona sin salida. US1 sola es el mínimo técnico, no un MVP publicable.
4. Después US3 (arrastrar) y US4 (calidad).

### Notas

- US1 y US2 son ambas P1: no conviene publicar el flujo feliz sin el manejo de errores.
- Si el usuario no concede el permiso Q-02, se construye todo menos T028 y T039, y el home conserva su aviso hasta que se resuelva; la pantalla nueva queda accesible solo por URL.
- El usuario es quien commitea; el asistente solo propone el nombre de commit.
