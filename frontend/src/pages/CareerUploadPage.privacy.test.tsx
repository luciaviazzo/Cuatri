import { render, screen } from '@testing-library/react'
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

const extractPlanMock = vi.mocked(extractPlan)
const sample = sampleJson as ExtractionResult

/** Una respuesta que, por error, trajera datos personales en campos que la pantalla no conoce. */
const withPersonalData = {
  ...sample,
  student: 'Ana Ficticia Pérez',
  legajo: '99999',
  plan_info: { ...sample.plan_info, student: 'Ana Ficticia Pérez', legajo: '99999' },
  subjects: sample.subjects.map((subject) => ({ ...subject, alumno: 'Ana Ficticia Pérez' })),
} as unknown as ExtractionResult

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

async function analyze(container: HTMLElement) {
  await userEvent.upload(fileInput(container), pdf())
  await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
  await screen.findByRole('heading', { level: 2 })
}

beforeEach(() => {
  extractPlanMock.mockClear()
  localStorage.clear()
  sessionStorage.clear()
})

describe('CareerUploadPage: privacidad', () => {
  it('no muestra datos personales aunque la respuesta los trajera', async () => {
    extractPlanMock.mockResolvedValue(withPersonalData)
    const { container } = renderPage()
    await analyze(container)
    const text = document.body.textContent ?? ''
    for (const secret of ['Ficticia', 'Pérez', '99999', 'Legajo', 'legajo', 'Alumno']) {
      expect(text).not.toContain(secret)
    }
  })

  it('no guarda nada en el dispositivo', async () => {
    extractPlanMock.mockResolvedValue(sample)
    const { container } = renderPage()
    await analyze(container)
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('al salir y volver a entrar el resultado se perdió y empieza de nuevo', async () => {
    extractPlanMock.mockResolvedValue(sample)
    const first = renderPage()
    await analyze(first.container)
    first.unmount()
    renderPage()
    expect(screen.queryByText('Esto es lo que encontramos')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Elegir archivo' })).toBeInTheDocument()
  })

  it('no escribe nada en la consola', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    extractPlanMock.mockResolvedValue(sample)
    const { container } = renderPage()
    await analyze(container)
    expect(log).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    log.mockRestore()
    error.mockRestore()
  })
})
