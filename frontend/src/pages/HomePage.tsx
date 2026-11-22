import { ButtonLink } from '../components/ButtonLink'
import { Logo } from '../components/Logo'
import { RainbowStripe } from '../components/RainbowStripe'
import { StepPill } from '../components/StepPill'
import { homeCopy } from './homeCopy'

/** Pantalla de inicio de Cuatri: explica qué hace la app y lleva a empezar. */
export function HomePage() {
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
          <ButtonLink to="/cargar-carrera">{homeCopy.primaryAction}</ButtonLink>
        </div>
      </main>
    </>
  )
}
