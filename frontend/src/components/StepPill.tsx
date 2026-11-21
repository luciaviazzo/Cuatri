import type { StepTone } from '../types/step'

const PILL: Record<StepTone, string> = {
  rose: 'bg-rainbow-rosa-bg border-rainbow-rosa-border text-rainbow-rosa-text',
  green: 'bg-rainbow-verde-bg border-rainbow-verde-border text-rainbow-verde-text',
  blue: 'bg-rainbow-celeste-bg border-rainbow-celeste-border text-rainbow-celeste-text',
}

// Los números llevan el texto principal: es el único que llega a 4,5:1 sobre los tres bordes.
const NUMBER: Record<StepTone, string> = {
  rose: 'bg-rainbow-rosa-border',
  green: 'bg-rainbow-verde-border',
  blue: 'bg-rainbow-celeste-border',
}

interface StepPillProps {
  number: number
  label: string
  tone: StepTone
}

/** Paso numerado, solo informativo: no es interactivo ni enfocable. */
export function StepPill({ number, label, tone }: StepPillProps) {
  return (
    <li
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold sm:px-4 sm:py-2 sm:text-base ${PILL[tone]}`}
    >
      {/* La lista ordenada ya numera para los lectores de pantalla. */}
      <span
        aria-hidden="true"
        className={`grid size-6 shrink-0 place-items-center rounded-full text-sm font-bold text-ink ${NUMBER[tone]}`}
      >
        {number}
      </span>
      <span>{label}</span>
    </li>
  )
}
