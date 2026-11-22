import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReviewNotice } from './ReviewNotice'

describe('ReviewNotice', () => {
  it('avisa que el resultado es solo para revisar y que no se guarda', () => {
    render(<ReviewNotice />)
    const text = screen.getByText(/solo para revisar/).textContent ?? ''
    expect(text).toContain('todavía no se guarda')
    expect(text).toContain('volver a subir el archivo')
  })
})
