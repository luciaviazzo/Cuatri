import type { ReactNode, Ref } from 'react'
import { primaryButtonClass } from './buttonStyles'

interface PrimaryButtonProps {
  onClick: () => void
  children: ReactNode
  ref?: Ref<HTMLButtonElement>
  disabled?: boolean
}

/** Botón principal de una pantalla: relleno rosa empolvado y borde rosa profundo (3:1 sobre el fondo). */
export function PrimaryButton({ onClick, children, ref, disabled }: PrimaryButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {children}
    </button>
  )
}
