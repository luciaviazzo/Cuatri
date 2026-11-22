import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ABORT_AFTER_MS, SLOW_AFTER_MS } from '../config'
import sampleJson from '../test-fixtures/extraction-sample.json'
import type { ExtractionErrorCode } from '../types/extraction'
import type { ExtractionResult } from '../types/plan'
import { CareerUploadPage } from './CareerUploadPage'
import { careerUploadCopy } from './careerUploadCopy'

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

function fileWith(name: string, size: number): File {
  const file = new File([], name)
  Object.defineProperty(file, 'size', { value: size })
  return file
}

beforeEach(() => {
  extractPlanMock.mockClear()
})

describe('CareerUploadPage: avisos antes de enviar', () => {
  it.each([
    ['plan.png', 100, 'invalid_file'],
    ['plan.pdf', 0, 'empty_file'],
    ['plan.pdf', 11 * 1024 * 1024, 'file_too_large'],
  ] as [string, number, ExtractionErrorCode][])(
    '%s de %s bytes avisa la causa y no llama al servicio',
    async (name, size, code) => {
      const { container } = renderPage()
      await userEvent.upload(fileInput(container), fileWith(name, size), { applyAccept: false })
      expect(screen.getByRole('alert')).toHaveTextContent(careerUploadCopy.errors[code])
      expect(screen.queryByRole('button', { name: 'Analizar mi plan' })).not.toBeInTheDocument()
      expect(extractPlanMock).not.toHaveBeenCalled()
    },
  )

  it('el mensaje recibe el foco', () => {
    const { container } = renderPage()
    fireEvent.change(fileInput(container), { target: { files: [fileWith('plan.png', 10)] } })
    expect(screen.getByRole('alert')).toHaveFocus()
  })

  it('soltar un archivo no válido avisa igual que con el botón', () => {
    renderPage()
    const area = screen.getByText('Arrastrá tu archivo acá').closest('div') as HTMLElement
    fireEvent.drop(area, { dataTransfer: { files: [fileWith('plan.png', 10)], types: ['Files'] } })
    expect(screen.getByRole('alert')).toHaveTextContent(careerUploadCopy.errors.invalid_file)
    expect(extractPlanMock).not.toHaveBeenCalled()
  })

  it('soltar un archivo válido deja listo el análisis', () => {
    renderPage()
    const area = screen.getByText('Arrastrá tu archivo acá').closest('div') as HTMLElement
    fireEvent.drop(area, { dataTransfer: { files: [pdf()], types: ['Files'] } })
    expect(screen.getByRole('button', { name: 'Analizar mi plan' })).toBeInTheDocument()
  })

  it('después del aviso se puede elegir otro archivo y seguir', async () => {
    const { container } = renderPage()
    await userEvent.upload(fileInput(container), fileWith('plan.png', 10), { applyAccept: false })
    await userEvent.upload(fileInput(container), pdf())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Analizar mi plan' })).toBeInTheDocument()
  })
})

describe('CareerUploadPage: errores del servicio', () => {
  it.each([
    'invalid_file',
    'empty_file',
    'file_too_large',
    'no_subjects_found',
    'service_unavailable',
  ] as ExtractionErrorCode[])('%s muestra su mensaje', async (code) => {
    extractPlanMock.mockRejectedValue(new ExtractionError(code))
    const { container } = renderPage()
    await userEvent.upload(fileInput(container), pdf())
    await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(careerUploadCopy.errors[code])
    expect(screen.getByRole('alert')).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Elegir otro archivo' })).toBeInTheDocument()
  })

  it('solo el servicio no disponible ofrece reintentar', async () => {
    extractPlanMock.mockRejectedValue(new ExtractionError('no_subjects_found'))
    const { container } = renderPage()
    await userEvent.upload(fileInput(container), pdf())
    await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    await screen.findByRole('alert')
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })

  it('"Reintentar" vuelve a enviar el mismo archivo y llega al resultado', async () => {
    extractPlanMock
      .mockRejectedValueOnce(new ExtractionError('service_unavailable'))
      .mockResolvedValueOnce(sample)
    const { container } = renderPage()
    const file = pdf()
    await userEvent.upload(fileInput(container), file)
    await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Esto es lo que encontramos' })).toBeInTheDocument()
    expect(extractPlanMock).toHaveBeenCalledTimes(2)
    expect(extractPlanMock.mock.calls[1][0]).toBe(file)
  })

  it('"Elegir otro archivo" abre el selector', async () => {
    extractPlanMock.mockRejectedValue(new ExtractionError('empty_file'))
    const { container } = renderPage()
    await userEvent.upload(fileInput(container), pdf())
    await userEvent.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    await screen.findByRole('alert')
    const click = vi.spyOn(fileInput(container), 'click')
    await userEvent.click(screen.getByRole('button', { name: 'Elegir otro archivo' }))
    expect(click).toHaveBeenCalledTimes(1)
  })
})

describe('CareerUploadPage: demora y límite de tiempo', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    extractPlanMock.mockImplementation(
      (_file, signal) =>
        new Promise<ExtractionResult>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new ExtractionError('service_unavailable')))
        }),
    )
  })
  afterEach(() => vi.useRealTimers())

  it('a los 10 s avisa la demora y a los 60 s muestra el error de servicio', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { container } = renderPage()
    await user.upload(fileInput(container), pdf())
    await user.click(screen.getByRole('button', { name: 'Analizar mi plan' }))
    expect(screen.queryByText(careerUploadCopy.slow)).not.toBeInTheDocument()

    await act(async () => void vi.advanceTimersByTime(SLOW_AFTER_MS))
    expect(screen.getAllByText(careerUploadCopy.slow).length).toBeGreaterThan(0)
    expect(screen.getByRole('status')).toHaveTextContent(careerUploadCopy.slow)

    await act(async () => void vi.advanceTimersByTime(ABORT_AFTER_MS - SLOW_AFTER_MS))
    expect(await screen.findByRole('alert')).toHaveTextContent(careerUploadCopy.errors.service_unavailable)
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
