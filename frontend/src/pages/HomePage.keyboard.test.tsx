import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

describe('HomePage: teclado', () => {
  it('Tab recorre el botón principal y luego "un plan de ejemplo"', async () => {
    const user = userEvent.setup()
    render(<HomePage />)
    await user.tab()
    expect(screen.getByRole('button', { name: '+ Cargar mi primera carrera' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'un plan de ejemplo' })).toHaveFocus()
  })

  it('con un aviso visible, el tercer Tab llega a "Cerrar aviso"', async () => {
    const user = userEvent.setup()
    render(<HomePage />)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Cerrar aviso' })).toHaveFocus()
  })

  it('los pasos no son enfocables: no hay otros elementos tabulables', async () => {
    render(<HomePage />)
    const tabbable = screen.getAllByRole('button')
    expect(tabbable).toHaveLength(2)
    for (const item of screen.getAllByRole('listitem')) {
      expect(item).not.toHaveAttribute('tabindex')
    }
  })

  it('Enter y Espacio activan el botón principal', async () => {
    const user = userEvent.setup()
    render(<HomePage />)
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('status')).not.toBeEmptyDOMElement()
    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    await user.keyboard(' ')
    expect(screen.getByRole('status')).not.toBeEmptyDOMElement()
  })
})
