import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import sampleJson from '../test-fixtures/extraction-sample.json'
import type { ExtractionResult } from '../types/plan'
import { CareerUploadPage } from './CareerUploadPage'

vi.mock('../service/planService', async () => {
  const actual = await vi.importActual<typeof import('../service/planService')>('../service/planService')
  return { ...actual, extractPlan: vi.fn(), warmUp: vi.fn().mockResolvedValue(undefined) }
})
import { extractPlan } from '../service/planService'

const sample = sampleJson as ExtractionResult
const extractPlanMock = vi.mocked(extractPlan)

function renderPage() {
  return render(
    <MemoryRouter>
      <CareerUploadPage />
    </MemoryRouter>,
  )
}

const fileInput = (container: HTMLElement) =>
  container.querySelector('input[type="file"]') as HTMLInputElement
const pdf = () => new File([new Uint8Array(2048)], 'plan.pdf', { type: 'application/pdf' })

/** Como el navegador: dispara el cambio del input sin que nadie vuelva a enfocarlo. */
function choose(container: HTMLElement, file: File) {
  fireEvent.change(fileInput(container), { target: { files: [file] } })
}

beforeEach(() => {
  extractPlanMock.mockClear()
})

describe('CareerUploadPage: teclado y foco', () => {
  it('el primer Tab llega a "Elegir archivo"', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Elegir archivo' })).toHaveFocus()
  })

  it('con un archivo elegido el foco va a "Analizar mi plan" y el orden de Tab sigue el contrato', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()
    choose(container, pdf())
    expect(screen.getByRole('button', { name: 'Analizar mi plan' })).toHaveFocus()

    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Cambiar archivo' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Elegir archivo' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Cambiar archivo' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Analizar mi plan' })).toHaveFocus()
  })

  it('"Analizar mi plan" se activa con Enter', async () => {
    extractPlanMock.mockResolvedValue(sample)
    const user = userEvent.setup()
    const { container } = renderPage()
    choose(container, pdf())
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { level: 2 })).toHaveFocus()
  })

  it('con el resultado, Tab recorre "Cargar otro archivo" y "Volver al inicio"', async () => {
    extractPlanMock.mockResolvedValue(sample)
    const user = userEvent.setup()
    const { container } = renderPage()
    choose(container, pdf())
    await user.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    await screen.findByRole('heading', { level: 2 })
    await user.tab()
    expect(screen.getByRole('button', { name: 'Cargar otro archivo' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveFocus()
  })

  it('"Cargar otro archivo" con teclado devuelve el foco a "Elegir archivo"', async () => {
    extractPlanMock.mockResolvedValue(sample)
    const user = userEvent.setup()
    const { container } = renderPage()
    choose(container, pdf())
    await user.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    await screen.findByRole('heading', { level: 2 })
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Elegir archivo' })).toHaveFocus()
  })
})
