import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { StepTone } from '../types/step'
import { StepPill } from './StepPill'

function renderPill(tone: StepTone) {
  return render(
    <ol>
      <StepPill number={2} label="Marcá tus materias" tone={tone} />
    </ol>,
  )
}

describe('StepPill', () => {
  it('muestra el número y el texto del paso', () => {
    renderPill('green')
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Marcá tus materias')).toBeInTheDocument()
  })

  it('es un ítem de lista informativo, no interactivo ni enfocable', () => {
    renderPill('rose')
    expect(screen.getByRole('listitem')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('listitem')).not.toHaveAttribute('tabindex')
  })

  it('oculta el número visible a los lectores de pantalla (la lista ya numera)', () => {
    renderPill('blue')
    expect(screen.getByText('2')).toHaveAttribute('aria-hidden', 'true')
  })

  it.each([
    ['rose', 'rosa'],
    ['green', 'verde'],
    ['blue', 'celeste'],
  ] as const)('el tono %s usa los colores pastel %s de la guía', (tone, color) => {
    renderPill(tone)
    const item = screen.getByRole('listitem')
    expect(item.className).toContain(`bg-rainbow-${color}-bg`)
    expect(item.className).toContain(`border-rainbow-${color}-border`)
    expect(item.className).toContain(`text-rainbow-${color}-text`)
  })
})
