import { useEffect, useRef } from 'react'
import { AnalyzingStatus } from '../components/AnalyzingStatus'
import { ButtonLink } from '../components/ButtonLink'
import { ErrorMessage } from '../components/ErrorMessage'
import { FileDropzone, type FileDropzoneHandle } from '../components/FileDropzone'
import { ModuleSection } from '../components/ModuleSection'
import { PrimaryButton } from '../components/PrimaryButton'
import { RainbowStripe } from '../components/RainbowStripe'
import { ResultSummary } from '../components/ResultSummary'
import { ReviewNotice } from '../components/ReviewNotice'
import { SelectedFile } from '../components/SelectedFile'
import { UndeterminedNote } from '../components/UndeterminedNote'
import { usePlanExtraction } from '../hooks/usePlanExtraction'
import { useBlockWindowDrop } from '../hooks/useBlockWindowDrop'
import { useWarmUp } from '../hooks/useWarmUp'
import { countApproved, groupByModule } from '../utils/groupByModule'
import { careerUploadCopy } from './careerUploadCopy'

/** Pantalla "Cargá tu carrera": subir el plan, analizarlo y revisar las materias detectadas. */
export function CareerUploadPage() {
  const { state, selectFile, analyze, retry, reset } = usePlanExtraction()
  const dropzone = useRef<FileDropzoneHandle>(null)
  const resultTitle = useRef<HTMLHeadingElement>(null)
  const errorBox = useRef<HTMLDivElement>(null)
  const analyzeButton = useRef<HTMLButtonElement>(null)
  const focusPickerAfterReset = useRef(false)

  useWarmUp()
  useBlockWindowDrop()

  // Al terminar el análisis el foco pasa al resultado o al mensaje de error: quien usa teclado o
  // lector de pantalla no se queda en un elemento que ya no existe.
  useEffect(() => {
    if (state.status === 'success') resultTitle.current?.focus()
    if (state.status === 'error') errorBox.current?.focus()
  }, [state.status])

  // Con un archivo listo el foco va a "Analizar mi plan": es el siguiente paso natural.
  const selectedFile = state.status === 'selected' ? state.file : null
  useEffect(() => {
    if (selectedFile !== null) analyzeButton.current?.focus()
  }, [selectedFile])

  useEffect(() => {
    if (state.status === 'idle' && focusPickerAfterReset.current) {
      focusPickerAfterReset.current = false
      dropzone.current?.focusChooseButton()
    }
  }, [state.status])

  const loadAnother = () => {
    focusPickerAfterReset.current = true
    reset()
  }

  const announcement =
    state.status === 'analyzing'
      ? state.slow
        ? `${careerUploadCopy.analyzing} ${careerUploadCopy.slow}`
        : careerUploadCopy.analyzing
      : state.status === 'success'
        ? careerUploadCopy.announce(
            state.result.subjects.length,
            countApproved(state.result.subjects),
          )
        : ''

  return (
    <>
      <RainbowStripe />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 text-center sm:px-6 sm:py-12">
        {/* Región viva siempre presente: los lectores solo anuncian cambios de una que ya existía. */}
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>

        <h1 className="font-display text-3xl leading-tight font-extrabold text-ink sm:text-5xl">
          {careerUploadCopy.title}
        </h1>

        {state.status === 'success' ? (
          <section className="mt-6">
            <h2
              ref={resultTitle}
              tabIndex={-1}
              className="font-display text-2xl font-bold text-rose-deep focus:outline-none"
            >
              {careerUploadCopy.resultTitle}
            </h2>
            <ResultSummary
              info={state.result.plan_info}
              total={state.result.subjects.length}
              approved={countApproved(state.result.subjects)}
            />
            <UndeterminedNote />
            <ReviewNotice />
            {groupByModule(state.result.subjects).map((group) => (
              <ModuleSection
                key={group.name ?? '__sin_modulo__'}
                name={group.name}
                subjects={group.subjects}
              />
            ))}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <PrimaryButton onClick={loadAnother}>{careerUploadCopy.loadAnother}</PrimaryButton>
              <ButtonLink to="/" variant="secondary">
                {careerUploadCopy.backHome}
              </ButtonLink>
            </div>
          </section>
        ) : (
          <>
            <p className="mx-auto mt-4 max-w-xl text-base text-ink-soft sm:text-lg">
              {careerUploadCopy.intro}
            </p>
            {state.status === 'analyzing' ? (
              <AnalyzingStatus slow={state.slow} />
            ) : (
              <div className="mt-6 space-y-4 sm:mt-8">
                {state.status === 'error' && (
                  <ErrorMessage
                    ref={errorBox}
                    code={state.code}
                    canRetry={state.canRetry}
                    onChooseOther={() => dropzone.current?.openPicker()}
                    onRetry={retry}
                  />
                )}
                <FileDropzone ref={dropzone} onFileSelected={selectFile} />
                {state.status === 'selected' && (
                  <>
                    <SelectedFile file={state.file} onChange={() => dropzone.current?.openPicker()} />
                    <PrimaryButton ref={analyzeButton} onClick={analyze}>
                      {careerUploadCopy.analyze}
                    </PrimaryButton>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
