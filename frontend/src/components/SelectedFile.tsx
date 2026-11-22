import { careerUploadCopy } from '../pages/careerUploadCopy'
import { formatFileSize } from '../utils/format'

interface SelectedFileProps {
  file: File
  onChange: () => void
}

/** Muestra el archivo elegido (nombre y tamaño) y permite cambiarlo antes de analizar. */
export function SelectedFile({ file, onChange }: SelectedFileProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl border border-control-border bg-white px-4 py-3 text-ink">
      <p className="min-w-0 break-words">
        <span className="font-semibold">{file.name}</span>{' '}
        <span className="text-ink-soft">({formatFileSize(file.size)})</span>
      </p>
      <button
        type="button"
        onClick={onChange}
        className="cursor-pointer font-semibold text-rose-deep underline underline-offset-4"
      >
        {careerUploadCopy.changeFile}
      </button>
    </div>
  )
}
