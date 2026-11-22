import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Materia } from '../types/plan'
import { ModuleSection } from './ModuleSection'

function subject(name: string): Materia {
  return {
    code: null,
    name,
    activity_type: 'Materia',
    credits: null,
    group: null,
    is_elective: false,
    year: null,
    reported_year: null,
    reported_term: null,
    origin: null,
    prerequisites: null,
    status: null,
  }
}

describe('ModuleSection', () => {
  it('muestra el nombre del módulo y la cantidad en un h3, con la lista de materias', () => {
    render(<ModuleSection name="Ciclo Introductorio" subjects={[subject('A'), subject('B')]} />)
    const heading = screen.getByRole('heading', { level: 3, name: 'Ciclo Introductorio (2)' })
    expect(heading).toBeInTheDocument()
    const section = screen.getByRole('region', { name: 'Ciclo Introductorio (2)' })
    expect(within(section).getAllByRole('listitem')).toHaveLength(2)
  })

  it('las materias sin módulo van bajo "Sin módulo"', () => {
    render(<ModuleSection name={null} subjects={[subject('A')]} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Sin módulo (1)' })).toBeInTheDocument()
  })
})
