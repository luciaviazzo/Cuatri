import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

afterEach(() => vi.unstubAllGlobals())

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

function follows(first: HTMLElement, second: HTMLElement): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)
}

describe('HomePage: contenido', () => {
  it('muestra el título en dos líneas con el texto exacto', () => {
    renderHome()
    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveTextContent('Planificá tu cursada sin volverte loca.')
    expect(screen.getByText('sin volverte loca.')).toBeInTheDocument()
  })

  it('la segunda línea del título va resaltada con el rosa profundo de la guía', () => {
    renderHome()
    expect(screen.getByText('sin volverte loca.').className).toContain('text-rose-deep')
    expect(screen.getByText('sin volverte loca.').className).not.toContain('rainbow')
  })

  it('muestra la bajada con el texto exacto', () => {
    renderHome()
    expect(
      screen.getByText(
        'Cargá tu carrera, marcá lo que aprobaste y Cuatri te muestra qué podés cursar, en qué orden y cuánto te queda.',
      ),
    ).toBeInTheDocument()
  })

  it('muestra el logo y el nombre de la marca', () => {
    renderHome()
    expect(screen.getByRole('img', { name: 'Logo de Cuatri' })).toBeInTheDocument()
    expect(screen.getByText('Cuatri')).toBeInTheDocument()
  })

  it('muestra los tres pasos en una lista ordenada y sin interacción', () => {
    renderHome()
    const items = screen.getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      '1Cargá tu carrera',
      '2Marcá tus materias',
      '3Generá opciones de cursada',
    ])
    expect(screen.getByRole('list')).toBeInTheDocument()
    for (const item of items) {
      expect(item.querySelector('button, a')).toBeNull()
    }
  })

  it('el botón principal es un enlace real a la pantalla de carga de la carrera', () => {
    renderHome()
    const link = screen.getByRole('link', { name: '+ Cargar mi primera carrera' })
    expect(link).toHaveAttribute('href', '/cargar-carrera')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('no muestra el texto ni el enlace del plan de ejemplo', () => {
    renderHome()
    expect(screen.queryByText(/plan de ejemplo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/O explorá/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('respeta el orden del contrato de arriba hacia abajo', () => {
    renderHome()
    const ordered = [
      screen.getByRole('img', { name: 'Logo de Cuatri' }),
      screen.getByText('Cuatri'),
      screen.getByRole('heading', { level: 1 }),
      screen.getByText(/^Cargá tu carrera, marcá lo que aprobaste/),
      screen.getByRole('list'),
      screen.getByRole('link', { name: '+ Cargar mi primera carrera' }),
    ]
    for (let i = 1; i < ordered.length; i++) {
      expect(follows(ordered[i - 1], ordered[i]), `elemento ${i}`).toBe(true)
    }
  })

  it('no tiene "Salir", pie de página, avisos ni indicador de estado del servicio', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    renderHome()
    expect(screen.queryByText(/salir/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText(/próximamente|backend|base de datos/i)).not.toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
