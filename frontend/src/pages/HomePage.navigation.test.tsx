import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'
import sampleJson from '../test-fixtures/extraction-sample.json'
import type { ExtractionResult } from '../types/plan'

vi.mock('../service/planService', async () => {
  const actual = await vi.importActual<typeof import('../service/planService')>('../service/planService')
  return { ...actual, extractPlan: vi.fn(), warmUp: vi.fn().mockResolvedValue(undefined) }
})
import { extractPlan } from '../service/planService'

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('navegación entre el inicio y la carga de la carrera', () => {
  it('el botón principal del inicio lleva a la pantalla de carga', async () => {
    renderApp('/')
    await userEvent.click(screen.getByRole('link', { name: '+ Cargar mi primera carrera' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Cargá tu carrera' })).toBeInTheDocument()
    expect(screen.queryByText('Planificá tu cursada')).not.toBeInTheDocument()
  })

  it('al activar el botón no aparece ningún aviso de "próximamente"', async () => {
    renderApp('/')
    await userEvent.click(screen.getByRole('link', { name: '+ Cargar mi primera carrera' }))
    expect(screen.queryByText(/muy pronto|próximamente/i)).not.toBeInTheDocument()
  })

  it('"Volver al inicio" desde el resultado lleva de vuelta al inicio', async () => {
    vi.mocked(extractPlan).mockResolvedValue(sampleJson as ExtractionResult)
    const { container } = renderApp('/cargar-carrera')
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File([new Uint8Array(100)], 'plan.pdf')] } })
    await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    await userEvent.click(await screen.findByRole('link', { name: 'Volver al inicio' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Planificá tu cursada sin volverte loca.',
    )
  })
})
