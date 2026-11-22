import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { careerUploadCopy } from '../pages/careerUploadCopy'
import type { ExtractionErrorCode } from '../types/extraction'
import { ErrorMessage } from './ErrorMessage'

const codes: ExtractionErrorCode[] = [
  'invalid_file',
  'empty_file',
  'file_too_large',
  'no_subjects_found',
  'service_unavailable',
]

describe('ErrorMessage', () => {
  it.each(codes)('%s tiene su propio mensaje, anunciado como alerta', (code) => {
    render(<ErrorMessage code={code} canRetry={false} onChooseOther={() => {}} onRetry={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent(careerUploadCopy.errors[code])
  })

  it('los cinco mensajes son distintos entre sí', () => {
    const messages = new Set(codes.map((code) => careerUploadCopy.errors[code]))
    expect(messages.size).toBe(codes.length)
  })

  it('siempre ofrece "Elegir otro archivo" y no ofrece reintentar si no corresponde', async () => {
    const onChooseOther = vi.fn()
    render(<ErrorMessage code="empty_file" canRetry={false} onChooseOther={onChooseOther} onRetry={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Elegir otro archivo' }))
    expect(onChooseOther).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })

  it('con servicio no disponible ofrece "Reintentar" además de elegir otro archivo', async () => {
    const onRetry = vi.fn()
    render(<ErrorMessage code="service_unavailable" canRetry onChooseOther={() => {}} onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Elegir otro archivo' })).toBeInTheDocument()
  })

  it('no muestra detalles técnicos', () => {
    render(<ErrorMessage code="service_unavailable" canRetry onChooseOther={() => {}} onRetry={() => {}} />)
    expect(screen.getByRole('alert').textContent).not.toMatch(/HTTP|500|Failed to fetch|undefined/i)
  })
})
