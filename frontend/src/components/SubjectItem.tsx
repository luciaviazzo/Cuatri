import { careerUploadCopy } from '../pages/careerUploadCopy'
import type { Estado, Materia } from '../types/plan'
import { formatCredits } from '../utils/format'

const chip =
  'inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-sm font-semibold whitespace-nowrap'
const chipNeutral = `${chip} border-control-border bg-cream text-ink-soft`
const chipApproved = `${chip} border-rainbow-verde-border bg-rainbow-verde-bg text-rainbow-verde-text`
const chipElective = `${chip} border-rainbow-violeta-border bg-rainbow-violeta-bg text-rainbow-violeta-text`

function StatusChip({ status }: { status: Estado | null }) {
  if (status === null) return <span className={chipNeutral}>{careerUploadCopy.noStatus}</span>
  if (status.kind === 'approved') {
    return <span className={chipApproved}>{careerUploadCopy.approved(status.grade)}</span>
  }
  if (status.kind === 'in_progress') {
    return <span className={chipNeutral}>{careerUploadCopy.inProgress}</span>
  }
  // Estado que el archivo trae y Cuatri no interpreta: se muestra literal, sin convertirlo.
  return <span className={chipNeutral}>{status.text ?? careerUploadCopy.noStatus}</span>
}

/** Una materia detectada: código, nombre, créditos y chips de optativa y de estado. */
export function SubjectItem({ subject }: { subject: Materia }) {
  return (
    <li className="rounded-xl border border-control-border bg-white px-4 py-3 text-left sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="break-words text-ink">
          <span className="mr-2 text-sm text-ink-soft tabular-nums">
            {subject.code ?? (
              <>
                <span className="sr-only">Código: </span>
                {careerUploadCopy.noData}
              </>
            )}
          </span>
          <span className="font-semibold">{subject.name}</span>
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {subject.credits === null ? (
            <>
              <span className="sr-only">Créditos: </span>
              {careerUploadCopy.noData}
            </>
          ) : (
            careerUploadCopy.credits(formatCredits(subject.credits))
          )}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
        {subject.is_elective && <span className={chipElective}>{careerUploadCopy.optional}</span>}
        <StatusChip status={subject.status} />
      </div>
    </li>
  )
}
