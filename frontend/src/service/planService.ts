import { API_URL } from '../config'
import type { ExtractionErrorCode } from '../types/extraction'
import type { ExtractionResult } from '../types/plan'

/** Error tipado de la extracción. El mensaje es solo el código: nunca texto técnico del servidor. */
export class ExtractionError extends Error {
  readonly code: ExtractionErrorCode

  constructor(code: ExtractionErrorCode) {
    super(code)
    this.name = 'ExtractionError'
    this.code = code
  }
}

const KNOWN_CODES: Record<string, ExtractionErrorCode> = {
  empty_file: 'empty_file',
  file_too_large: 'file_too_large',
  invalid_file: 'invalid_file',
  no_subjects_found: 'no_subjects_found',
  validation_error: 'invalid_file',
}

async function codeFromErrorResponse(response: Response): Promise<ExtractionErrorCode> {
  try {
    const body = (await response.json()) as { error?: { code?: unknown } }
    const code = body?.error?.code
    return (typeof code === 'string' && KNOWN_CODES[code]) || 'service_unavailable'
  } catch {
    return 'service_unavailable'
  }
}

/**
 * Envía el archivo al servicio de extracción (POST multipart, campo `file`). No fija el
 * Content-Type: el navegador agrega el `boundary`. Todo lo que no sea una causa conocida del
 * servicio (red, CORS, aborto, 5xx, cuerpo ilegible) es `service_unavailable`.
 */
export async function extractPlan(file: File, signal?: AbortSignal): Promise<ExtractionResult> {
  const body = new FormData()
  body.append('file', file)

  let response: Response
  try {
    response = await fetch(`${API_URL}/planes/extraccion`, { method: 'POST', body, signal })
  } catch {
    throw new ExtractionError('service_unavailable')
  }

  if (!response.ok) throw new ExtractionError(await codeFromErrorResponse(response))

  try {
    return (await response.json()) as ExtractionResult
  } catch {
    throw new ExtractionError('service_unavailable')
  }
}

/** Despierta al backend gratuito mientras la persona elige el archivo. Nunca lanza error. */
export async function warmUp(): Promise<void> {
  try {
    await fetch(`${API_URL}/health`, { method: 'GET' })
  } catch {
    // Silencioso a propósito: es solo una ayuda para reducir la espera.
  }
}
