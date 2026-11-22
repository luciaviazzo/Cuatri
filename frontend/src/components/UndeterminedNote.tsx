import { careerUploadCopy } from '../pages/careerUploadCopy'

/** Aclara una sola vez que el año del plan y las correlativas figuran "sin determinar". */
export function UndeterminedNote() {
  return (
    <p className="mt-4 rounded-xl border border-control-border bg-white px-4 py-3 text-left text-ink">
      {careerUploadCopy.undeterminedNote}
    </p>
  )
}
