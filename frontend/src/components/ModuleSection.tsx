import { useId } from 'react'
import { careerUploadCopy } from '../pages/careerUploadCopy'
import type { Materia } from '../types/plan'
import { SubjectItem } from './SubjectItem'

interface ModuleSectionProps {
  /** Nombre del módulo; `null` agrupa las materias sin módulo. */
  name: string | null
  subjects: Materia[]
}

/** Un módulo con su nombre, la cantidad de materias y la lista de materias. */
export function ModuleSection({ name, subjects }: ModuleSectionProps) {
  const headingId = useId()
  const label = careerUploadCopy.moduleHeading(name ?? careerUploadCopy.noModule, subjects.length)

  return (
    <section aria-labelledby={headingId} className="mt-8 text-left">
      <h3 id={headingId} className="font-display text-xl font-bold break-words text-rose-deep">
        {label}
      </h3>
      <ul className="mt-3 grid gap-3">
        {subjects.map((subject, index) => (
          <SubjectItem key={`${subject.code ?? subject.name}-${index}`} subject={subject} />
        ))}
      </ul>
    </section>
  )
}
