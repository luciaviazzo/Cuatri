import { useRef } from 'react'
import { Logo } from '../components/Logo'
import { Notice } from '../components/Notice'
import { PrimaryButton } from '../components/PrimaryButton'
import { RainbowStripe } from '../components/RainbowStripe'
import { StepPill } from '../components/StepPill'
import { useNotice } from '../hooks/useNotice'
import { homeCopy } from './homeCopy'

/** Pantalla de inicio de Cuatri: explica qué hace la app y lleva a empezar. */
export function HomePage() {
  const { activeNotice, show, dismiss } = useNotice()
  const careerButton = useRef<HTMLButtonElement>(null)
  const sampleButton = useRef<HTMLButtonElement>(null)

  // Al cerrar el aviso el botón "Cerrar" desaparece: el foco vuelve a quien lo abrió.
  const handleDismiss = () => {
    const opener = activeNotice === 'sample' ? sampleButton : careerButton
    dismiss()
    opener.current?.focus()
  }

  return (
    <>
      <RainbowStripe />
      <main className="mx-auto flex min-h-[calc(100dvh-0.375rem)] w-full max-w-3xl flex-col items-center justify-center px-4 py-6 text-center sm:px-6 sm:py-10">
        <Logo />
        <p className="mt-2 font-display text-lg font-bold text-rose-deep sm:mt-3 sm:text-xl">
          {homeCopy.brand}
        </p>

        <h1 className="mt-5 font-display text-[clamp(1.875rem,8.5vw,4rem)] leading-[1.05] font-extrabold tracking-tight text-ink sm:mt-8">
          {homeCopy.titleLine1} <span className="block text-rose-deep">{homeCopy.titleLine2}</span>
        </h1>

        <p className="mt-4 max-w-lg text-base text-ink-soft sm:mt-6 sm:text-xl">{homeCopy.lead}</p>

        <ol
          aria-label={homeCopy.stepsLabel}
          className="mt-6 flex list-none flex-wrap justify-center gap-2 sm:mt-8 sm:gap-3"
        >
          {homeCopy.steps.map((step, index) => (
            <StepPill key={step.label} number={index + 1} label={step.label} tone={step.tone} />
          ))}
        </ol>

        <div className="mt-6 sm:mt-10">
          <PrimaryButton ref={careerButton} onClick={() => show('career')}>{homeCopy.primaryAction}</PrimaryButton>
        </div>

        {/* Hoy no hay destino: se comporta como acción (botón) con aspecto de enlace. */}
        <p className="mt-3 text-sm text-ink-soft sm:mt-4">
          {homeCopy.samplePrefix}{' '}
          <button
            ref={sampleButton}
            type="button"
            onClick={() => show('sample')}
            className="cursor-pointer font-semibold text-rose-deep underline decoration-rose-powder underline-offset-4"
          >
            {homeCopy.sampleAction}
          </button>{' '}
          {homeCopy.sampleSuffix}
        </p>

        <Notice kind={activeNotice} onDismiss={handleDismiss} />
      </main>
    </>
  )
}
