import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import sample from '../test-fixtures/extraction-sample.json'
import type { ExtractionResult } from '../types/plan'
import { usePlanExtraction } from './usePlanExtraction'

vi.mock('../service/planService', async () => {
  const actual = await vi.importActual<typeof import('../service/planService')>('../service/planService')
  return { ...actual, extractPlan: vi.fn() }
})
import { extractPlan } from '../service/planService'

const extractPlanMock = vi.mocked(extractPlan)
const file = new File([new Uint8Array(1024)], 'plan.pdf', { type: 'application/pdf' })

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  extractPlanMock.mockReset()
})

describe('usePlanExtraction (camino feliz)', () => {
  it('empieza en idle', () => {
    const { result } = renderHook(() => usePlanExtraction())
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('elegir un archivo pasa a selected', () => {
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(file))
    expect(result.current.state).toEqual({ status: 'selected', file })
  })

  it('elegir otro archivo antes de empezar reemplaza al anterior', () => {
    const other = new File([new Uint8Array(10)], 'otro.xls')
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(file))
    act(() => result.current.selectFile(other))
    expect(result.current.state).toEqual({ status: 'selected', file: other })
  })

  it('analizar pasa a analyzing y luego a success con el resultado', async () => {
    const pending = deferred<ExtractionResult>()
    extractPlanMock.mockReturnValue(pending.promise)
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(file))
    act(() => result.current.analyze())
    expect(result.current.state).toMatchObject({ status: 'analyzing', file, slow: false })
    await act(async () => pending.resolve(sample as ExtractionResult))
    expect(result.current.state).toMatchObject({ status: 'success' })
    expect(extractPlanMock).toHaveBeenCalledWith(file, expect.any(AbortSignal))
  })

  it('un segundo analizar mientras analiza no envía otra petición', async () => {
    const pending = deferred<ExtractionResult>()
    extractPlanMock.mockReturnValue(pending.promise)
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(file))
    act(() => {
      result.current.analyze()
      result.current.analyze()
      result.current.analyze()
    })
    expect(extractPlanMock).toHaveBeenCalledTimes(1)
    await act(async () => pending.resolve(sample as ExtractionResult))
  })

  it('analizar sin archivo elegido no hace nada', () => {
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.analyze())
    expect(extractPlanMock).not.toHaveBeenCalled()
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('reiniciar vuelve a idle y descarta el resultado', async () => {
    extractPlanMock.mockResolvedValue(sample as ExtractionResult)
    const { result } = renderHook(() => usePlanExtraction())
    act(() => result.current.selectFile(file))
    await act(async () => result.current.analyze())
    expect(result.current.state.status).toBe('success')
    act(() => result.current.reset())
    expect(result.current.state).toEqual({ status: 'idle' })
  })
})
