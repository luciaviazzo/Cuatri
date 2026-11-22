import { useCallback, useEffect, useRef, useState } from 'react'
import { ABORT_AFTER_MS, SLOW_AFTER_MS } from '../config'
import { ExtractionError, extractPlan } from '../service/planService'
import type { ExtractionErrorCode, ExtractionState } from '../types/extraction'
import { validateFile } from '../utils/validateFile'

/**
 * Máquina de estados de la pantalla de carga: idle → selected → analyzing → success | error.
 * El resultado vive solo en memoria: no se guarda en ningún lado.
 */
export function usePlanExtraction() {
  const [state, setState] = useState<ExtractionState>({ status: 'idle' })
  const file = useRef<File | null>(null)
  const inFlight = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  // Cada análisis tiene un número: un resultado tardío de uno descartado se ignora.
  const run = useRef(0)

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const cancelRunning = useCallback(() => {
    run.current += 1
    clearTimers()
    controller.current?.abort()
    controller.current = null
    inFlight.current = false
  }, [clearTimers])

  // Al salir de la pantalla se aborta lo pendiente y se limpian los temporizadores.
  useEffect(() => cancelRunning, [cancelRunning])

  const selectFile = useCallback((chosen: File) => {
    const issue = validateFile(chosen)
    if (issue !== null) {
      file.current = null
      setState({ status: 'error', code: issue, file: chosen, canRetry: false })
      return
    }
    file.current = chosen
    setState({ status: 'selected', file: chosen })
  }, [])

  const analyze = useCallback(() => {
    const current = file.current
    // Un solo envío por análisis: ignora toques repetidos mientras hay uno en curso.
    if (current === null || inFlight.current) return
    inFlight.current = true
    const id = ++run.current
    const abortController = new AbortController()
    controller.current = abortController
    setState({ status: 'analyzing', file: current, slow: false })

    timers.current.push(
      setTimeout(() => {
        setState((previous) => (previous.status === 'analyzing' ? { ...previous, slow: true } : previous))
      }, SLOW_AFTER_MS),
      setTimeout(() => abortController.abort(), ABORT_AFTER_MS),
    )

    extractPlan(current, abortController.signal)
      .then((result) => {
        if (run.current === id) setState({ status: 'success', result })
      })
      .catch((error: unknown) => {
        if (run.current !== id) return
        const code: ExtractionErrorCode =
          error instanceof ExtractionError ? error.code : 'service_unavailable'
        setState({ status: 'error', code, file: current, canRetry: code === 'service_unavailable' })
      })
      .finally(() => {
        if (run.current !== id) return
        clearTimers()
        controller.current = null
        inFlight.current = false
      })
  }, [clearTimers])

  const reset = useCallback(() => {
    cancelRunning()
    file.current = null
    setState({ status: 'idle' })
  }, [cancelRunning])

  /** Reintenta con el mismo archivo (solo tiene sentido tras un servicio no disponible). */
  const retry = analyze

  return { state, selectFile, analyze, retry, reset }
}
