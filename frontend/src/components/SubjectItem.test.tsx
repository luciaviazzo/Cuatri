import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Materia } from '../types/plan'
import { SubjectItem } from './SubjectItem'

const base: Materia = {
  code: '80000',
  name: 'Lectura y Escritura Académica',
  activity_type: 'Materia',
  credits: '10.00',
  group: 'Ciclo Introductorio',
  is_elective: false,
  year: null,
  reported_year: null,
  reported_term: null,
  origin: 'Promoción',
  prerequisites: null,
  status: { kind: 'approved', grade: '9', condition: 'Promocionado', text: null },
}

function renderItem(subject: Materia) {
  return render(
    <ul>
      <SubjectItem subject={subject} />
    </ul>,
  )
}

describe('SubjectItem', () => {
  it('muestra código, nombre y créditos formateados', () => {
    renderItem(base)
    expect(screen.getByText('80000')).toBeInTheDocument()
    expect(screen.getByText('Lectura y Escritura Académica')).toBeInTheDocument()
    expect(screen.getByText('10 créditos')).toBeInTheDocument()
  })

  it('una aprobada muestra la nota en un chip', () => {
    renderItem(base)
    expect(screen.getByText('Aprobada · nota 9')).toBeInTheDocument()
  })

  it('sin estado muestra "Sin estado"', () => {
    renderItem({ ...base, status: null })
    expect(screen.getByText('Sin estado')).toBeInTheDocument()
  })

  it('en curso y estado literal no interpretado se muestran sin convertirlos', () => {
    const { unmount } = renderItem({
      ...base,
      status: { kind: 'in_progress', grade: null, condition: null, text: null },
    })
    expect(screen.getByText('En curso')).toBeInTheDocument()
    unmount()
    renderItem({
      ...base,
      status: { kind: 'unparsed', grade: null, condition: null, text: '2 (Desaprobado)' },
    })
    expect(screen.getByText('2 (Desaprobado)')).toBeInTheDocument()
    expect(screen.queryByText(/Aprobada/)).not.toBeInTheDocument()
  })

  it('una optativa lleva su chip', () => {
    renderItem({ ...base, is_elective: true })
    expect(screen.getByText('Optativa')).toBeInTheDocument()
  })

  it('una materia que no es optativa no lleva el chip', () => {
    renderItem(base)
    expect(screen.queryByText('Optativa')).not.toBeInTheDocument()
  })

  it('los datos ausentes figuran como "sin dato", no vacíos ni inventados', () => {
    renderItem({ ...base, code: null, credits: null })
    expect(screen.getAllByText('sin dato').length).toBeGreaterThanOrEqual(2)
  })

  it('créditos con decimales usan coma', () => {
    renderItem({ ...base, credits: '4.50' })
    expect(screen.getByText('4,5 créditos')).toBeInTheDocument()
  })
})
