import { careerUploadCopy } from '../pages/careerUploadCopy'

/** Estado de carga: texto claro y spinner decorativo. El anuncio a lectores lo hace la región de estado de la página. */
export function AnalyzingStatus({ slow }: { slow: boolean }) {
  return (
    <div aria-busy="true" className="flex flex-col items-center gap-3 py-10 text-center">
      <span
        aria-hidden="true"
        className="size-10 animate-spin rounded-full border-4 border-rose-powder border-t-rose-deep"
      />
      <p className="font-display text-lg font-bold text-ink">{careerUploadCopy.analyzing}</p>
      {slow && <p className="text-ink-soft">{careerUploadCopy.slow}</p>}
    </div>
  )
}
