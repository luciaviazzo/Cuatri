import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PrimaryButton } from './PrimaryButton'

describe('PrimaryButton', () => {
  it('es un botón de tipo button con el texto indicado', () => {
    render(<PrimaryButton onClick={() => {}}>+ Cargar mi primera carrera</PrimaryButton>)
    const button = screen.getByRole('button', { name: '+ Cargar mi primera carrera' })
    expect(button).toHaveAttribute('type', 'button')
  })

  it('llama a onClick al activarse con mouse y con teclado', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<PrimaryButton onClick={onClick}>Empezar</PrimaryButton>)
    await user.click(screen.getByRole('button'))
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(3)
  })
})
