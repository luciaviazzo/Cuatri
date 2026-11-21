import type { ReactNode, Ref } from 'react'

interface PrimaryButtonProps {
  onClick: () => void
  children: ReactNode
  ref?: Ref<HTMLButtonElement>
}

/** Botón principal de la pantalla: relleno rosa empolvado y borde rosa profundo (3:1 sobre el fondo). */
export function PrimaryButton({ onClick, children, ref }: PrimaryButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-xl border-2 border-rose-deep bg-rose-powder px-6 py-3 font-display text-base sm:px-8 sm:py-4 sm:text-lg font-bold text-ink transition-[background-color] hover:bg-rose-powder/70"
    >
      {children}
    </button>
  )
}
