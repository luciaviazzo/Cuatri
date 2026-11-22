import { careerUploadCopy } from '../pages/careerUploadCopy'

/** Avisa que el resultado es solo para revisar y todavía no se guarda. */
export function ReviewNotice() {
  return (
    <p className="mt-4 rounded-xl border border-rainbow-amarillo-border bg-rainbow-amarillo-bg px-4 py-3 text-left text-rainbow-amarillo-text">
      {careerUploadCopy.reviewNotice}
    </p>
  )
}
