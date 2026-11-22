import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { HomePage } from './HomePage'

describe('HomePage: teclado', () => {
  it('el primer Tab llega al botón principal', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    await user.tab()
    expect(screen.getByRole('link', { name: '+ Cargar mi primera carrera' })).toHaveFocus()
  })

  it('los pasos no son enfocables: el único elemento tabulable es el botón principal', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    for (const item of screen.getAllByRole('listitem')) {
      expect(item).not.toHaveAttribute('tabindex')
    }
  })

  it('Enter en el botón principal lleva a la pantalla de carga de la carrera', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    await user.tab()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { level: 1, name: 'Cargá tu carrera' })).toBeInTheDocument()
  })
})
