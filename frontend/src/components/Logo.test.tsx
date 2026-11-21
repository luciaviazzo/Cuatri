import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Logo } from './Logo'

describe('Logo', () => {
  it('es la imagen /logo.svg con texto alternativo y tamaño declarado', () => {
    render(<Logo />)
    const logo = screen.getByRole('img', { name: 'Logo de Cuatri' })
    expect(logo).toHaveAttribute('src', '/logo.svg')
    expect(logo).toHaveAttribute('width', '72')
    expect(logo).toHaveAttribute('height', '72')
  })
})
