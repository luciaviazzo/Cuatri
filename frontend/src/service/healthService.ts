import type { HealthResponse } from '../types/health'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`)
  if (!response.ok) {
    throw new Error(`El backend respondió ${response.status}`)
  }
  return (await response.json()) as HealthResponse
}
