import type { Materia } from '../types/plan'

export interface ModuleGroup {
  /** Nombre del módulo; `null` agrupa las materias sin módulo ("Sin módulo"). */
  name: string | null
  subjects: Materia[]
}

/** Agrupa por módulo en el orden de primera aparición. */
export function groupByModule(subjects: Materia[]): ModuleGroup[] {
  const groups = new Map<string | null, ModuleGroup>()
  for (const subject of subjects) {
    const existing = groups.get(subject.group)
    if (existing) {
      existing.subjects.push(subject)
    } else {
      groups.set(subject.group, { name: subject.group, subjects: [subject] })
    }
  }
  return [...groups.values()]
}

export function countApproved(subjects: Materia[]): number {
  return subjects.filter((subject) => subject.status?.kind === 'approved').length
}
