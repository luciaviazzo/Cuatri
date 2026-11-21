import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

describe('HomePage: semántica y accesibilidad', () => {
  it('tiene un solo h1, una lista ordenada de tres pasos y una región de estado', () => {
    render(<HomePage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('list')).toHaveLength(1)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('todos los controles tienen nombre accesible y las imágenes, texto alternativo', () => {
    render(<HomePage />)
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAccessibleName()
    }
    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAccessibleName()
    }
  })

  it('axe no encuentra violaciones en el estado inicial', async () => {
    const { container } = render(<HomePage />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('axe no encuentra violaciones con un aviso visible', async () => {
    const { container } = render(<HomePage />)
    await userEvent.click(screen.getByRole('button', { name: '+ Cargar mi primera carrera' }))
    expect(await axe(container)).toHaveNoViolations()
  })
})
