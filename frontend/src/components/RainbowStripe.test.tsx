import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RainbowStripe } from './RainbowStripe'

describe('RainbowStripe', () => {
  it('es decorativa: está oculta para los lectores de pantalla', () => {
    const { container } = render(<RainbowStripe />)
    const stripe = container.firstElementChild as HTMLElement
    expect(stripe).toHaveAttribute('aria-hidden', 'true')
  })

  it('usa un degradado con los siete fondos pastel de la guía', () => {
    const { container } = render(<RainbowStripe />)
    const background = (container.firstElementChild as HTMLElement).style.background
    for (const name of ['rosa', 'durazno', 'amarillo', 'verde', 'celeste', 'violeta', 'turquesa']) {
      expect(background).toContain(`--color-rainbow-${name}-bg`)
    }
  })
})
