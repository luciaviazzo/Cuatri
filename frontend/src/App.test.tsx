import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('rutas de la app', () => {
  it('"/" muestra el inicio', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Planificá tu cursada sin volverte loca.',
    )
  })

  it('"/cargar-carrera" muestra la pantalla de carga de la carrera', () => {
    renderAt('/cargar-carrera')
    expect(screen.getByRole('heading', { level: 1, name: 'Cargá tu carrera' })).toBeInTheDocument()
  })
})
