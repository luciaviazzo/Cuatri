import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage: semántica y accesibilidad', () => {
  it('tiene un solo h1 y una lista ordenada de tres pasos', () => {
    renderHome()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('list')).toHaveLength(1)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('todos los enlaces tienen nombre accesible y las imágenes, texto alternativo', () => {
    renderHome()
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAccessibleName()
    }
    for (const image of screen.getAllByRole('img')) {
      expect(image).toHaveAccessibleName()
    }
  })

  it('axe no encuentra violaciones', async () => {
    const { container } = renderHome()
    expect(await axe(container)).toHaveNoViolations()
  })
})
