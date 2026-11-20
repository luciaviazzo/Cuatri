import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

afterEach(() => vi.unstubAllGlobals())

describe('HomePage', () => {
  it('muestra el estado del backend cuando /health responde OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', database: 'up' }),
      }),
    )
    render(<HomePage />)
    expect(await screen.findByText(/Backend: ok · Base de datos: up/)).toBeInTheDocument()
  })

  it('muestra un error cuando el backend no responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    render(<HomePage />)
    expect(await screen.findByText(/Backend no disponible: boom/)).toBeInTheDocument()
  })
})
