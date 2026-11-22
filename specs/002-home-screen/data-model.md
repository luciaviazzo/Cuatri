# Modelo de la interfaz: Pantalla de inicio

> **Nota (2026-11-21)**: la feature 003 (cargar la carrera) reemplazó el aviso de "próximamente" por la
> navegación real. Todo lo que este documento dice sobre `Notice`, `useNotice` y los avisos quedó
> retirado; ver `specs/003-career-upload/` y `spec.md` de esta feature.

No hay datos persistentes ni red. Esta feature define tokens de estilo, tipos de los componentes y el
único estado de la pantalla: el aviso visible. Las constantes de texto viven en
`src/pages/homeCopy.ts`; los tipos, en `src/types/`.

## Estado: aviso visible (`hooks/useNotice.ts`)

| Elemento | Tipo | Regla |
|----------|------|-------|
| `NoticeKind` (`types/notice.ts`) | `'career'` | `career`: botón "Cargar mi primera carrera". El tipo es una unión para sumar avisos cuando otras features lo pidan |
| `activeNotice` | `NoticeKind \| null` | Como máximo uno a la vez (FR-010). Inicia en `null` |
| `show(kind)` | acción | Reemplaza el aviso actual; si ya es el mismo, no cambia nada (no se duplica ni se re-anuncia) |
| `dismiss()` | acción | Pone `activeNotice` en `null` |

### Transiciones

| Desde | Evento | Hacia |
|-------|--------|-------|
| `null` | `show('career')` | `career` |
| `career` | `show('career')` | `career` (sin cambio: no se duplica) |
| `career` | `dismiss()` | `null` |
| `null` | `dismiss()` | `null` |

## Tipos de componentes

| Componente | Props | Reglas |
|------------|-------|--------|
| `StepTone` (`types/step.ts`) | `'rose' \| 'green' \| 'blue'` | Color pastel del paso (FR-005) |
| `StepPill` | `number: number`, `label: string`, `tone: StepTone` | No interactivo; el número visible va `aria-hidden` |
| `PrimaryButton` | `onClick: () => void`, `children` | `type="button"`; texto "+ Cargar mi primera carrera" |
| `Notice` | `kind: NoticeKind \| null`, `onDismiss: () => void` | La región `role="status"` siempre existe; sin `kind`, queda vacía |
| `Logo` | — | `/logo.svg`, `alt="Logo de Cuatri"`, `width`/`height` 72 |
| `RainbowStripe` | — | Decorativa (`aria-hidden`), altura fija |

## Tokens de estilo (`@theme` en `index.css`)

Valores de la guía de estilo; los componentes los consumen solo por clase de Tailwind.

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-cream` | `#FDFBF7` | Fondo de la app |
| `--color-white` | `#FFFFFF` | Paneles |
| `--color-ink` | `#3B3A3A` | Texto principal |
| `--color-ink-soft` | `#6B6868` | Texto secundario |
| `--color-control-border` | `#8F8888` | Bordes de controles |
| `--color-rose-powder` | `#E2B3C4` | Relleno del botón principal |
| `--color-rose-deep` | `#8F4562` | Títulos, enlaces, anillo de foco, borde del botón |
| `--color-lavender` | `#A6B1E2` | Secundario (no se usa en el home) |
| `--color-rainbow-{rosa,durazno,amarillo,verde,celeste,violeta,turquesa}-bg` | fondos de la guía (`#F9CFD8`, `#FDDCC4`, `#FBEFB5`, `#CDEFD6`, `#CBE6F8`, `#DDD3F7`, `#C8EEEA`) | Franja y pills |
| `--color-rainbow-*-border` | bordes de la guía (`#E58AA0`, `#EBA36B`, `#D9BE45`, `#7BC693`, `#7DB8E0`, `#A08AE0`, `#6FC4BA`) | Bordes y círculos numerados |
| `--color-rainbow-*-text` | textos oscuros de la guía (`#6B2237`, `#6B3510`, `#5A4800`, `#1F5133`, `#17476B`, `#3B2D75`, `#12504A`) | Texto sobre su fondo pastel |
| `--font-display` | Montserrat Variable | Títulos y marca |
| `--font-body` | Source Sans 3 Variable | Cuerpo |

Regla de uso de la guía: el texto pastel nunca va sobre blanco o crema; se usa la variante oscura.
