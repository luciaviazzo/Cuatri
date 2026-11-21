import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

afterEach(() => vi.unstubAllGlobals())

function follows(first: HTMLElement, second: HTMLElement): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)
}

describe('HomePage: contenido', () => {
  it('muestra el título en dos líneas con el texto exacto', () => {
    render(<HomePage />)
    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveTextContent('Planificá tu cursada sin volverte loca.')
    expect(screen.getByText('sin volverte loca.')).toBeInTheDocument()
  })

  it('la segunda línea del título va resaltada con el rosa profundo de la guía', () => {
    render(<HomePage />)
    expect(screen.getByText('sin volverte loca.').className).toContain('text-rose-deep')
    expect(screen.getByText('sin volverte loca.').className).not.toContain('rainbow')
  })

  it('muestra la bajada con el texto exacto', () => {
    render(<HomePage />)
    expect(
      screen.getByText(
        'Cargá tu carrera, marcá lo que aprobaste y Cuatri te muestra qué podés cursar, en qué orden y cuánto te queda.',
      ),
    ).toBeInTheDocument()
  })

  it('muestra el logo y el nombre de la marca', () => {
    render(<HomePage />)
    expect(screen.getByRole('img', { name: 'Logo de Cuatri' })).toBeInTheDocument()
    expect(screen.getByText('Cuatri')).toBeInTheDocument()
  })

  it('muestra los tres pasos en una lista ordenada y sin interacción', () => {
    render(<HomePage />)
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

  it('muestra el botón principal y el texto con "un plan de ejemplo" como acción', () => {
    render(<HomePage />)
    expect(screen.getByRole('button', { name: '+ Cargar mi primera carrera' })).toBeInTheDocument()
    const sample = screen.getByRole('button', { name: 'un plan de ejemplo' })
    expect(sample.closest('p')).toHaveTextContent(
      'O explorá un plan de ejemplo para ver cómo funciona.',
    )
  })

  it('respeta el orden del contrato de arriba hacia abajo', () => {
    render(<HomePage />)
    const ordered = [
      screen.getByRole('img', { name: 'Logo de Cuatri' }),
      screen.getByText('Cuatri'),
      screen.getByRole('heading', { level: 1 }),
      screen.getByText(/^Cargá tu carrera, marcá lo que aprobaste/),
      screen.getByRole('list'),
      screen.getByRole('button', { name: '+ Cargar mi primera carrera' }),
      screen.getByRole('button', { name: 'un plan de ejemplo' }),
      screen.getByRole('status'),
    ]
    for (let i = 1; i < ordered.length; i++) {
      expect(follows(ordered[i - 1], ordered[i]), `elemento ${i}`).toBe(true)
    }
  })

  it('no tiene "Salir", pie de página ni indicador de estado del servicio', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    render(<HomePage />)
    expect(screen.queryByText(/salir/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.queryByText(/backend|base de datos/i)).not.toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('arranca sin ningún aviso visible', () => {
    render(<HomePage />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
