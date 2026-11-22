import {
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type Ref,
} from 'react'
import { careerUploadCopy } from '../pages/careerUploadCopy'
import { secondaryButtonClass } from './buttonStyles'

export interface FileDropzoneHandle {
  openPicker: () => void
  focusChooseButton: () => void
}

interface FileDropzoneProps {
  onFileSelected: (file: File) => void
  ref?: Ref<FileDropzoneHandle>
}

const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files')

/**
 * Área de carga: botón "Elegir archivo" y, como comodidad adicional, arrastrar y soltar. Todo lo
 * que se puede hacer arrastrando se puede hacer con el botón y con teclado.
 */
export function FileDropzone({ onFileSelected, ref }: FileDropzoneProps) {
  const input = useRef<HTMLInputElement>(null)
  const chooseButton = useRef<HTMLButtonElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dropped, setDropped] = useState<File[]>([])
  // Entrar a un hijo dispara dragleave en el padre: se cuentan entradas y salidas para no parpadear.
  const depth = useRef(0)

  useImperativeHandle(
    ref,
    () => ({
      openPicker: () => input.current?.click(),
      focusChooseButton: () => chooseButton.current?.focus(),
    }),
    [],
  )

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Se limpia para que elegir el mismo archivo otra vez vuelva a disparar el cambio.
    event.target.value = ''
    if (file) {
      setDropped([])
      onFileSelected(file)
    }
  }

  const handleDragEnter = (event: DragEvent) => {
    if (!carriesFiles(event)) return
    event.preventDefault()
    depth.current += 1
    setDragging(true)
  }

  const handleDragOver = (event: DragEvent) => {
    if (!carriesFiles(event)) return
    event.preventDefault()
  }

  const handleDragLeave = (event: DragEvent) => {
    if (!carriesFiles(event)) return
    depth.current = Math.max(0, depth.current - 1)
    if (depth.current === 0) setDragging(false)
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    depth.current = 0
    setDragging(false)
    const files = Array.from(event.dataTransfer?.files ?? [])
    if (files.length === 0) return
    if (files.length === 1) {
      setDropped([])
      onFileSelected(files[0])
    } else {
      setDropped(files)
    }
  }

  const choose = (file: File) => {
    setDropped([])
    onFileSelected(file)
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border-2 border-dashed bg-white px-6 py-8 text-center sm:py-10 ${
        dragging ? 'border-rose-deep' : 'border-control-border'
      }`}
    >
      <p className="font-display text-lg font-bold text-ink sm:text-xl">
        {dragging ? careerUploadCopy.dropActive : careerUploadCopy.dropzoneTitle}
      </p>
      <p className="my-3 text-ink-soft">{careerUploadCopy.dropzoneOr}</p>
      <button
        ref={chooseButton}
        type="button"
        onClick={() => input.current?.click()}
        className={secondaryButtonClass}
      >
        {careerUploadCopy.chooseFile}
      </button>
      <input
        ref={input}
        type="file"
        accept=".pdf,.xls,application/pdf,application/vnd.ms-excel"
        onChange={handleChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {dropped.length > 1 && (
        <div className="mt-6 border-t border-control-border pt-4">
          <p className="font-semibold text-ink">{careerUploadCopy.multipleDropped(dropped.length)}</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {dropped.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                <button
                  type="button"
                  onClick={() => choose(file)}
                  className="cursor-pointer rounded-lg border border-control-border bg-cream px-3 py-2 font-semibold text-rose-deep underline underline-offset-4"
                >
                  {file.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
