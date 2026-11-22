import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import sampleJson from '../test-fixtures/extraction-sample.json'
import type { ExtractionResult } from '../types/plan'
import { CareerUploadPage } from './CareerUploadPage'

vi.mock('../service/planService', async () => {
  const actual = await vi.importActual<typeof import('../service/planService')>('../service/planService')
  return { ...actual, extractPlan: vi.fn(), warmUp: vi.fn().mockResolvedValue(undefined) }
})
import { ExtractionError, extractPlan } from '../service/planService'

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

beforeEach(() => {
  extractPlanMock.mockClear()
})

describe('CareerUploadPage: accesibilidad por estado', () => {
  it('idle: sin violaciones, un solo h1 y la región de estado presente', async () => {
    const { container } = renderPage()
    expect(await axe(container)).toHaveNoViolations()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('selected: sin violaciones', async () => {
    const { container } = renderPage()
    await userEvent.upload(fileInput(container), pdf())
    expect(await axe(container)).toHaveNoViolations()
  })

  it('analyzing: sin violaciones y marcado como ocupado', async () => {
    extractPlanMock.mockReturnValue(new Promise<ExtractionResult>(() => {}))
    const { container } = renderPage()
    await userEvent.upload(fileInput(container), pdf())
    await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('success: sin violaciones, jerarquía h1 → h2 → h3 y una sección por módulo', async () => {
    extractPlanMock.mockResolvedValue(sample)
    const { container } = renderPage()
    await userEvent.upload(fileInput(container), pdf())
    await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    await screen.findByRole('heading', { level: 2 })
    expect(await axe(container)).toHaveNoViolations()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    const modules = screen.getAllByRole('heading', { level: 3 })
    expect(modules.length).toBeGreaterThan(3)
    expect(screen.getAllByRole('region')).toHaveLength(modules.length)
  })

  it('error: sin violaciones y anunciado como alerta', async () => {
    extractPlanMock.mockRejectedValue(new ExtractionError('no_subjects_found'))
    const { container } = renderPage()
    await userEvent.upload(fileInput(container), pdf())
    await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    await screen.findByRole('alert')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('todos los controles tienen nombre accesible', async () => {
    extractPlanMock.mockResolvedValue(sample)
    const { container } = renderPage()
    await userEvent.upload(fileInput(container), pdf())
    await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    await screen.findByRole('heading', { level: 2 })
    for (const control of [...screen.getAllByRole('button'), ...screen.getAllByRole('link')]) {
      expect(control).toHaveAccessibleName()
    }
  })
})
