import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ButtonLink } from './ButtonLink'

describe('ButtonLink', () => {
  it('es un enlace real con el destino indicado', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/cargar-carrera">+ Cargar mi primera carrera</ButtonLink>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: '+ Cargar mi primera carrera' })
    expect(link).toHaveAttribute('href', '/cargar-carrera')
  })

  it('usa el estilo del botón principal por defecto y el secundario si se pide', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/a">Principal</ButtonLink>
        <ButtonLink to="/b" variant="secondary">
          Secundario
        </ButtonLink>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Principal' }).className).toContain('bg-rose-powder')
    expect(screen.getByRole('link', { name: 'Secundario' }).className).toContain('bg-white')
  })
})
