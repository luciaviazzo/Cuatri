import { describe, expect, it } from 'vitest'
import type { Estado, Materia } from '../types/plan'
import { countApproved, groupByModule } from './groupByModule'

function subject(name: string, group: string | null, status: Estado | null = null): Materia {
  return {
    code: null,
    name,
    activity_type: 'Materia',
    credits: null,
    group,
    is_elective: false,
    year: null,
    reported_year: null,
    reported_term: null,
    origin: null,
    prerequisites: null,
    status,
  }
}

const approved: Estado = { kind: 'approved', grade: '9', condition: 'Promocionado', text: null }
const unparsed: Estado = { kind: 'unparsed', grade: null, condition: null, text: '2 (Desaprobado)' }

describe('groupByModule', () => {
  it('agrupa por módulo en el orden de primera aparición', () => {
    const groups = groupByModule([
      subject('A', 'Uno'),
      subject('B', 'Dos'),
      subject('C', 'Uno'),
    ])
    expect(groups.map((g) => g.name)).toEqual(['Uno', 'Dos'])
    expect(groups[0].subjects.map((s) => s.name)).toEqual(['A', 'C'])
  })

  it('las materias sin módulo quedan en un grupo con nombre nulo', () => {
    const groups = groupByModule([subject('A', null), subject('B', 'Uno'), subject('C', null)])
    expect(groups.map((g) => g.name)).toEqual([null, 'Uno'])
    expect(groups[0].subjects.map((s) => s.name)).toEqual(['A', 'C'])
  })

  it('la suma de los módulos coincide con el total', () => {
    const subjects = [subject('A', 'Uno'), subject('B', null), subject('C', 'Dos'), subject('D', 'Uno')]
    const total = groupByModule(subjects).reduce((sum, g) => sum + g.subjects.length, 0)
    expect(total).toBe(subjects.length)
  })

  it('una lista vacía da cero módulos', () => {
    expect(groupByModule([])).toEqual([])
  })
})

describe('countApproved', () => {
  it('cuenta solo las aprobadas', () => {
    expect(
      countApproved([
        subject('A', 'Uno', approved),
        subject('B', 'Uno', unparsed),
        subject('C', 'Uno', null),
        subject('D', 'Dos', approved),
      ]),
    ).toBe(2)
  })

  it('sin materias da cero', () => {
    expect(countApproved([])).toBe(0)
  })
})
