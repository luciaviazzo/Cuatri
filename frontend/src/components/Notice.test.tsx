import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { homeCopy } from '../pages/homeCopy'
import { Notice } from './Notice'

describe('Notice', () => {
  it('la región de estado existe siempre, aun sin aviso, para que se anuncie al aparecer', () => {
    const { rerender } = render(<Notice kind={null} onDismiss={() => {}} />)
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toBeEmptyDOMElement()
    rerender(<Notice kind="career" onDismiss={() => {}} />)
    expect(screen.getByRole('status')).toBe(region)
    expect(region).toHaveTextContent(homeCopy.notices.career)
  })

  it.each(['career', 'sample'] as const)('muestra el texto del aviso %s', (kind) => {
    render(<Notice kind={kind} onDismiss={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent(homeCopy.notices[kind])
  })

  it('tiene un botón "Cerrar aviso" que llama a onDismiss', async () => {
    const onDismiss = vi.fn()
    render(<Notice kind="sample" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('lleva el aviso a la vista al aparecer, sin mover el foco', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const { rerender } = render(<Notice kind={null} onDismiss={() => {}} />)
    expect(scrollIntoView).not.toHaveBeenCalled()
    rerender(<Notice kind="career" onDismiss={() => {}} />)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'nearest' }))
    expect(document.body).toHaveFocus()
  })

  it('sin aviso no hay botón de cierre', () => {
    render(<Notice kind={null} onDismiss={() => {}} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
