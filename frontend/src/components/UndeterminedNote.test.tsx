import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UndeterminedNote } from './UndeterminedNote'

describe('UndeterminedNote', () => {
  it('explica que el año del plan y las correlativas figuran como "sin determinar"', () => {
    render(<UndeterminedNote />)
    const text = screen.getByText(/sin determinar/).textContent ?? ''
    expect(text).toContain('año del plan')
    expect(text).toContain('correlativas')
    expect(text).toContain('Más adelante vas a poder completarlos')
  })
})
