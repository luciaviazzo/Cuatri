# Research y decisiones: Cargar la carrera

## R-01. Navegación con `react-router`

- **Decision**: `react-router` (8.5.x, peer React >= 19.2.7) en modo librería con `BrowserRouter`;
  rutas `/` y `/cargar-carrera`.
- **Rationale**: la app necesita más de una pantalla y las próximas features suman más (revisión,
  materias, cursada). `vercel.json` ya reescribe todo a `index.html`, así que el acceso directo y la
  recarga funcionan.
- **Verificar al instalar**: la versión 8 es muy reciente para este análisis; se confirma que
  `BrowserRouter`, `Routes`, `Route`, `Link` y `useNavigate` siguen con la misma forma que en la
  v7. Si cambió, se ajusta en la tarea de instalación sin cambiar el diseño.
- **Alternatives**: router propio con la History API (menos dependencia, pero hay que reescribirlo
  en cada feature); TanStack Router (más peso y configuración para lo que se necesita hoy).

## R-02. El botón del home pasa a ser un enlace

- **Decision**: `ButtonLink` (un `Link` con el estilo del botón principal) hacia `/cargar-carrera`.
  `PrimaryButton` queda para acciones (por ejemplo "Analizar mi plan").
- **Rationale**: navegar es un enlace, no un botón (semántica, clic con botón central, "abrir en
  pestaña nueva"). El estilo se comparte en una constante.
- **Consecuencia**: el aviso de "próximamente" deja de existir. Cambian la feature 002 (FR-009,
  FR-010, US2) y sus tests; hay que actualizar ese spec **antes** de tocar el código (Principio XI) y
  pedir permiso por los tests (Q-02).

## R-03. Capa de servicio y mapeo de errores

- **Decision**: `service/planService.ts` con `extractPlan(file, signal)` (POST multipart con
  `FormData`, campo `file`, sin fijar el `Content-Type` para que el navegador agregue el `boundary`)
  y `warmUp()`. Los errores se traducen según [contracts/api-consumption.md](contracts/api-consumption.md).
- **Rationale**: Principio II: solo `service/` accede a la red; los hooks reciben errores tipados y
  nunca interpretan HTTP.
- **Regla de traducción**: se usa el `code` del cuerpo cuando existe; cualquier falla de red,
  aborto, estado 5xx, 429 o cuerpo no interpretable es `service_unavailable`.

## R-04. Tiempos, aborto y warm-up

- **Decision**: a los 10 s se marca "lento" (aviso amable); a los 60 s se aborta con
  `AbortController` y se trata como `service_unavailable`. Al entrar a la pantalla se dispara un
  `GET /health` (warm-up) sin mostrar nada.
- **Rationale**: el backend gratuito de Render se duerme y su primera respuesta tarda cerca de un
  minuto; despertarlo mientras la persona elige el archivo recorta la espera real. Los umbrales son
  supuestos del spec (Q-04).
- **Detalles**: los temporizadores se limpian y la petición se aborta al desmontar la pantalla o al
  reiniciar; un envío mientras hay otro en curso se ignora (SC-008).
- **Riesgo**: si el arranque supera 60 s, la persona ve el error de servicio con "Reintentar", que
  ya encuentra el backend despierto.

## R-05. Validación previa al envío

- **Decision**: antes de enviar se comprueba la extensión (`.pdf` o `.xls`, sin distinguir
  mayúsculas), el tamaño (<= 10 MB) y que no esté vacío. El atributo `accept` del input filtra el
  selector pero no se confía en él.
- **Rationale**: ahorra un viaje de red y da el aviso inmediato que pide FR-005. Es orientativo: el
  servicio decide por el contenido real (una imagen renombrada `.pdf` pasa el control previo y la
  rechaza el servicio con `invalid_file`).
- **Riesgo (Q-06)**: `MAX_UPLOAD_BYTES` replica el límite por defecto del backend; si cambia allá hay
  que actualizar `config.ts`.
- **Alternatives**: validar por tipo MIME (el navegador lo infiere por la extensión y en Windows
  suele ser inconsistente para `.xls`).

## R-06. Arrastrar y soltar

- **Decision**: eventos nativos de arrastre sobre el área (`dragenter`, `dragover`, `dragleave`,
  `drop`) con un contador para no parpadear al pasar sobre hijos, `dataTransfer.files` para leer los
  archivos y estado visual de "soltá acá". Si se sueltan varios, se muestra una lista para elegir uno.
- **Rationale**: es una comodidad opcional (US3); el botón y el teclado cubren lo mismo (FR-020).
- **Caso borde**: soltar un archivo fuera del área hace que el navegador lo abra y la app se
  pierda. Mientras la pantalla está montada se cancela el comportamiento por defecto de `dragover` y
  `drop` a nivel de ventana, y solo el área procesa el archivo.
- **Alternatives**: librería de dropzone (dependencia extra para algo que son ~40 líneas).

## R-07. Accesibilidad y manejo del foco

- **Decision**:
  - Región `role="status"` (`aria-live="polite"`) siempre presente: anuncia "Analizando…", el aviso
    de demora y el resultado ("61 materias detectadas, 24 aprobadas").
  - Errores con `role="alert"`.
  - Al terminar con éxito el foco pasa al título del resultado (`h2` con `tabIndex={-1}`); ante un
    error, al contenedor del mensaje. "Cargar otro archivo" devuelve el foco a "Elegir archivo".
  - Durante el análisis el botón queda deshabilitado y el contenedor lleva `aria-busy="true"`.
- **Rationale**: FR-021; sin mover el foco, quien navega con teclado o lector queda en un elemento que
  ya no existe.
- **Alternatives**: `role="alert"` también para el resultado (interrumpe y es excesivo).

## R-08. Listado legible con 60+ materias

- **Decision**: cada módulo es una `section` con `h3` (nombre y cantidad) y una lista `ul`; cada
  materia es una tarjeta apilada que pasa a una fila en pantallas anchas. Sin tabla, sin
  virtualización. Funciones puras en `utils/`: `groupByModule` (orden de primera aparición, "Sin
  módulo" para los vacíos), `formatCredits` (`"10.00"` → `10`, `"4.50"` → `4,5`), `formatFileSize`
  y `validateFile`.
- **Rationale**: una tabla de varias columnas obliga a scroll horizontal en 320 px (SC-006); 61
  elementos no justifican virtualizar.
- **Estados mostrados**: `approved` → "Aprobada · nota N" (verde); `in_progress` → "En curso";
  `unparsed` → el texto literal del archivo (neutro); sin estado → "Sin estado" (neutro).
  Optativa → chip violeta. Códigos o créditos ausentes → "sin dato".

## R-09. Colores y contraste

Todos los pares nuevos se calcularon con la fórmula WCAG sobre los tokens existentes:

| Par | Contraste | Mínimo | Resultado |
|-----|-----------|--------|-----------|
| Texto `#3B3A3A` sobre blanco (tarjetas) | 11,34 | 4,5 | OK |
| Texto secundario `#6B6868` sobre blanco | 5,52 | 4,5 | OK |
| Rosa profundo `#8F4562` sobre blanco | 6,57 | 4,5 | OK |
| Chip "Sin estado": secundario sobre crema | 5,34 | 4,5 | OK |
| Chip optativa: `#3B2D75` / `#DDD3F7` | 8,10 | 4,5 | OK |
| Chip aprobada: `#1F5133` / `#CDEFD6` | 7,41 | 4,5 | OK |
| Error: `#6B2237` / `#F9CFD8` | 7,83 | 4,5 | OK |
| Aviso de revisión: `#5A4800` / `#FBEFB5` | 7,67 | 4,5 | OK |
| Borde del área de carga (`#8F8888`) sobre crema | 3,36 | 3 | OK |
| Borde al arrastrar (rosa profundo) sobre crema | 6,36 | 3 | OK |

Estos pares se agregan al test de contraste de tokens existente.

## R-10. Privacidad

- La pantalla solo renderiza los campos del resultado de la API; el backend ya no devuelve nombre ni
  legajo (feature 001).
- No hay `console`, registro ni almacenamiento de nada del archivo o del resultado; se descartan al
  salir o recargar.
- Un test con la muestra verifica que no aparece ningún dato personal.

## R-11. Estrategia de pruebas

- **Service** con `fetch` simulado: éxito, cada código de error, red caída, aborto, respuesta no
  JSON, `FormData` con el campo `file`.
- **Hook** con temporizadores simulados: aviso a los 10 s, aborto a los 60 s, un solo envío,
  reintento, reinicio, aborto al desmontar.
- **Componentes y página** con `MemoryRouter`: elegir por botón; arrastrar (uno, inválido, varios,
  soltar fuera); validación previa; flujo completo con un JSON de la muestra sintética como fixture
  (`src/test-fixtures/`, generado del backend, sin datos personales); agrupación por módulo; "sin
  determinar"; ausencia de nombre y legajo; foco y regiones vivas; orden de Tab; `vitest-axe`.
- **Se extienden** el test de contraste (R-09) y el de arquitectura.
- **Navegador real** (Edge vía `playwright-core` fuera del repo): arrastre real, foco visible, 60+
  materias en 320 px, sin scroll horizontal y una subida real de la muestra sintética contra el
  backend de Render.
- **No se agrega** Playwright al proyecto: la constitución define Vitest + React Testing Library.

## R-12. Configuración

- `VITE_API_URL` ya existe en Vercel; sin ella el build apunta a `http://localhost:8000` (desarrollo).
  `config.ts` concentra `API_URL`, `MAX_UPLOAD_BYTES` y los tiempos para no repartir constantes.

## R-13. CORS

- El backend ya permite el origen de Vercel (`CORS_ORIGINS`) y `multipart/form-data` es una solicitud
  simple (sin preflight). Un bloqueo de CORS llega al navegador como error de red y se trata como
  `service_unavailable`.
- **Riesgo (Q-07)**: las vistas previas de Vercel tienen otro dominio y no estarían permitidas; y el
  desarrollo local contra el backend de Render requiere sumar `http://localhost:5173` a
  `CORS_ORIGINS`.

## R-14. Efectos sobre la feature 002 (home)

Hay que actualizar el spec 002 (FR-009, FR-010, US2) y, con permiso (Q-02): borrar `Notice`,
`useNotice`, `types/notice.ts` y sus tests; y adaptar los tests de `HomePage` (el botón principal
pasa a ser un enlace, el orden de Tab y la cantidad de botones cambian). Los tests de `StepPill`,
`Logo`, `RainbowStripe`, `PrimaryButton` y el de contraste siguen vigentes.
