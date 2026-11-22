import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ABORT_AFTER_MS, MAX_UPLOAD_BYTES, SLOW_AFTER_MS } from '../config'
import sample from '../test-fixtures/extraction-sample.json'
import type { ExtractionErrorCode } from '../types/extraction'
import type { ExtractionResult } from '../types/plan'
import { usePlanExtraction } from './usePlanExtraction'

vi.mock('../service/planService', async () => {
  const actual = await vi.importActual<typeof import('../service/planService')>('../service/planService')
  return { ...actual, extractPlan: vi.fn() }
})
import { ExtractionError, extractPlan } from '../service/planService'

const extractPlanMock = vi.mocked(extractPlan)
const pdf = new File([new Uint8Array(1024)], 'plan.pdf')

/** Una petición que queda colgada hasta que la abortan (como un backend dormido). */
function hangingRequest() {
  extractPlanMock.mockImplementation(
    (_file, signal) =>
      new Promise<ExtractionResult>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new ExtractionError('service_unavailable')))
      }),
  )
}

beforeEach(() => {
  extractPlanMock.mockReset()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('usePlanExtraction: validación previa', () => {
  it.each([
    ['plan.png', 10, 'invalid_file'],
    ['plan.pdf', 0, 'empty_file'],
    ['plan.pdf', MAX_UPLOAD_BYTES + 1, 'file_too_large'],
  ] as const)('%s de %s bytes se rechaza como %s sin enviar nada', (name, size, code) => {
    const file = new File([], name)
    Object.defineProperty(file, 'size', { value: size })
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(file))
    expect(result.current.state).toEqual({ status: 'error', code, file, canRetry: false })
    act(() => result.current.analyze())
    expect(extractPlanMock).not.toHaveBeenCalled()
  })

  it('después de un archivo inválido se puede elegir uno válido', () => {
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(new File([new Uint8Array(5)], 'plan.png')))
    act(() => result.current.selectFile(pdf))
    expect(result.current.state).toEqual({ status: 'selected', file: pdf })
  })
})

describe('usePlanExtraction: errores del servicio', () => {
  it.each([
    ['invalid_file', false],
    ['empty_file', false],
    ['file_too_large', false],
    ['no_subjects_found', false],
    ['service_unavailable', true],
  ] as [ExtractionErrorCode, boolean][])('%s lleva a error (reintentable: %s)', async (code, canRetry) => {
    extractPlanMock.mockRejectedValue(new ExtractionError(code))
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(pdf))
    await act(async () => result.current.analyze())
    expect(result.current.state).toEqual({ status: 'error', code, file: pdf, canRetry })
  })

  it('un error inesperado se trata como servicio no disponible', async () => {
    extractPlanMock.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(pdf))
    await act(async () => result.current.analyze())
    expect(result.current.state).toMatchObject({ status: 'error', code: 'service_unavailable', canRetry: true })
  })

  it('se puede reintentar con el mismo archivo después de un servicio no disponible', async () => {
    extractPlanMock
      .mockRejectedValueOnce(new ExtractionError('service_unavailable'))
      .mockResolvedValueOnce(sample as ExtractionResult)
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(pdf))
    await act(async () => result.current.analyze())
    expect(result.current.state.status).toBe('error')
    await act(async () => result.current.retry())
    expect(result.current.state.status).toBe('success')
    expect(extractPlanMock).toHaveBeenCalledTimes(2)
    expect(extractPlanMock.mock.calls[1][0]).toBe(pdf)
  })

  it('reiniciar desde un error vuelve a idle', async () => {
    extractPlanMock.mockRejectedValue(new ExtractionError('no_subjects_found'))
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(pdf))
    await act(async () => result.current.analyze())
    act(() => result.current.reset())
    expect(result.current.state).toEqual({ status: 'idle' })
  })
})

describe('usePlanExtraction: demora y límite de tiempo', () => {
  it('a los 10 s marca la demora y a los 60 s aborta como servicio no disponible', async () => {
    hangingRequest()
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(pdf))
    act(() => result.current.analyze())
    expect(result.current.state).toMatchObject({ status: 'analyzing', slow: false })

    act(() => void vi.advanceTimersByTime(SLOW_AFTER_MS - 1))
    expect(result.current.state).toMatchObject({ status: 'analyzing', slow: false })
    act(() => void vi.advanceTimersByTime(1))
    expect(result.current.state).toMatchObject({ status: 'analyzing', slow: true })

    await act(async () => void vi.advanceTimersByTime(ABORT_AFTER_MS - SLOW_AFTER_MS))
    expect(result.current.state).toEqual({
      status: 'error',
      code: 'service_unavailable',
      file: pdf,
      canRetry: true,
    })
  })

  it('una respuesta a tiempo cancela los temporizadores', async () => {
    extractPlanMock.mockResolvedValue(sample as ExtractionResult)
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(pdf))
    await act(async () => result.current.analyze())
    expect(result.current.state.status).toBe('success')
    act(() => void vi.advanceTimersByTime(ABORT_AFTER_MS * 2))
    expect(result.current.state.status).toBe('success')
  })

  it('al salir de la pantalla aborta lo pendiente y limpia los temporizadores', () => {
    hangingRequest()
    const { result, unmount } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(pdf))
    act(() => result.current.analyze())
    const signal = extractPlanMock.mock.calls[0][1] as AbortSignal
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reiniciar durante un análisis lo aborta y descarta su resultado tardío', async () => {
    hangingRequest()
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(pdf))
    act(() => result.current.analyze())
    const signal = extractPlanMock.mock.calls[0][1] as AbortSignal
    await act(async () => result.current.reset())
    expect(signal.aborted).toBe(true)
    expect(result.current.state).toEqual({ status: 'idle' })
  })
})
