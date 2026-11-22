import type { Ref } from 'react'
import { careerUploadCopy } from '../pages/careerUploadCopy'
import type { ExtractionErrorCode } from '../types/extraction'
import { PrimaryButton } from './PrimaryButton'
import { secondaryButtonClass } from './buttonStyles'

interface ErrorMessageProps {
  code: ExtractionErrorCode
  /** Solo con servicio no disponible: permite reintentar con el mismo archivo. */
  canRetry: boolean
  onChooseOther: () => void
  onRetry: () => void
  ref?: Ref<HTMLDivElement>
}

/** Mensaje amable y distinto por causa, con las acciones para continuar. */
export function ErrorMessage({ code, canRetry, onChooseOther, onRetry, ref }: ErrorMessageProps) {
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-xl border border-rainbow-rosa-border bg-rainbow-rosa-bg px-4 py-4 text-center text-rainbow-rosa-text"
    >
      <p className="text-base font-semibold sm:text-lg">{careerUploadCopy.errors[code]}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {canRetry && <PrimaryButton onClick={onRetry}>{careerUploadCopy.retry}</PrimaryButton>}
        <button type="button" onClick={onChooseOther} className={secondaryButtonClass}>
          {careerUploadCopy.chooseOther}
        </button>
      </div>
    </div>
  )
}
