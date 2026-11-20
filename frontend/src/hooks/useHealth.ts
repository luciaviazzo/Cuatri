import { useEffect, useState } from 'react'
import { fetchHealth } from '../service/healthService'
import type { HealthResponse } from '../types/health'

export type HealthState =
  | { status: 'loading' }
  | { status: 'ok'; data: HealthResponse }
  | { status: 'error'; message: string }

export function useHealth(): HealthState {
  const [state, setState] = useState<HealthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetchHealth()
      .then((data) => !cancelled && setState({ status: 'ok', data }))
      .catch((e: unknown) =>
        !cancelled &&
        setState({ status: 'error', message: e instanceof Error ? e.message : 'Error desconocido' }),
      )
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
