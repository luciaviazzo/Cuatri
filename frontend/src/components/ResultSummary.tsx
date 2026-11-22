import { careerUploadCopy } from '../pages/careerUploadCopy'
import type { PlanInfo } from '../types/plan'

interface ResultSummaryProps {
  info: PlanInfo
  total: number
  approved: number
}

/** Resumen del resultado: carrera, plan y versión (solo los que el archivo trae) y los totales. */
export function ResultSummary({ info, total, approved }: ResultSummaryProps) {
  const entries = [
    [careerUploadCopy.program, info.program],
    [careerUploadCopy.plan, info.plan],
    [careerUploadCopy.version, info.version],
  ].filter((entry): entry is [string, string] => entry[1] !== null)

  return (
    <div className="mt-4 text-center">
      {entries.length > 0 && (
        <dl className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-ink-soft">
          {entries.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="font-semibold">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-2 font-display text-lg font-bold text-ink">
        {careerUploadCopy.found(total, approved)}
      </p>
    </div>
  )
}
