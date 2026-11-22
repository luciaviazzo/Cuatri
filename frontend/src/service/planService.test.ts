import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_URL } from '../config'
import sample from '../test-fixtures/extraction-sample.json'
import type { ExtractionResult } from '../types/plan'
import { ExtractionError, extractPlan, warmUp } from './planService'

afterEach(() => vi.unstubAllGlobals())

const file = new File([new Uint8Array(10)], 'plan.pdf', { type: 'application/pdf' })

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
  } catch (error) {
    return error instanceof ExtractionError ? error.code : `inesperado: ${String(error)}`
  }
  return undefined
}

describe('extractPlan', () => {
  it('envía el archivo como multipart en el campo "file" sin fijar el Content-Type', async () => {
    const fetchMock = stubFetch(jsonResponse(sample, 200))
    await extractPlan(file)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${API_URL}/planes/extraccion`)
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get('file')).toBeInstanceOf(File)
    expect(init.headers).toBeUndefined()
  })

  it('devuelve el resultado tipado', async () => {
    stubFetch(jsonResponse(sample, 200))
    const result: ExtractionResult = await extractPlan(file)
    expect(result.subjects).toHaveLength(14)
    expect(result.plan_info.program).toBe('Licenciatura en Informática')
  })

  it('pasa la señal de aborto a fetch', async () => {
    const fetchMock = stubFetch(jsonResponse(sample, 200))
    const controller = new AbortController()
    await extractPlan(file, controller.signal)
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.signal).toBe(controller.signal)
  })

  it.each([
    [400, 'empty_file', 'empty_file'],
    [413, 'file_too_large', 'file_too_large'],
    [422, 'invalid_file', 'invalid_file'],
    [422, 'no_subjects_found', 'no_subjects_found'],
    [422, 'validation_error', 'invalid_file'],
  ])('un %s con el código %s se traduce a %s', async (status, code, expected) => {
    stubFetch(jsonResponse({ error: { code, message: 'x' } }, status))
    expect(await codeOf(extractPlan(file))).toBe(expected)
  })

  it.each([500, 502, 503, 429, 404])('un estado %s sin código conocido es servicio no disponible', async (status) => {
    stubFetch(jsonResponse({ error: { code: 'internal_error', message: 'x' } }, status))
    expect(await codeOf(extractPlan(file))).toBe('service_unavailable')
  })

  it('un cuerpo de error que no es JSON es servicio no disponible', async () => {
    stubFetch(new Response('<html>Bad gateway</html>', { status: 502 }))
    expect(await codeOf(extractPlan(file))).toBe('service_unavailable')
  })

  it('una respuesta 200 que no es JSON es servicio no disponible', async () => {
    stubFetch(new Response('no es json', { status: 200 }))
    expect(await codeOf(extractPlan(file))).toBe('service_unavailable')
  })

  it('una falla de red (o de CORS) es servicio no disponible', async () => {
    stubFetch(new TypeError('Failed to fetch'))
    expect(await codeOf(extractPlan(file))).toBe('service_unavailable')
  })

  it('un aborto es servicio no disponible', async () => {
    stubFetch(new DOMException('Aborted', 'AbortError'))
    expect(await codeOf(extractPlan(file))).toBe('service_unavailable')
  })

  it('no muestra el mensaje técnico del backend en el error', async () => {
    stubFetch(jsonResponse({ error: { code: 'empty_file', message: 'mensaje del servidor' } }, 400))
    try {
      await extractPlan(file)
    } catch (error) {
      expect((error as Error).message).not.toContain('mensaje del servidor')
    }
  })
})

describe('warmUp', () => {
  it('llama a GET /health', async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 'ok' }, 200))
    await warmUp()
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/health`, expect.anything())
  })

  it('nunca lanza error, aunque falle la red', async () => {
    stubFetch(new TypeError('Failed to fetch'))
    await expect(warmUp()).resolves.toBeUndefined()
  })
})
