import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { primaryButtonClass, secondaryButtonClass } from './buttonStyles'

interface ButtonLinkProps {
  to: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
}

/** Enlace de navegación real con el aspecto de un botón (se puede abrir en otra pestaña). */
export function ButtonLink({ to, children, variant = 'primary' }: ButtonLinkProps) {
  return (
    <Link to={to} className={variant === 'primary' ? primaryButtonClass : secondaryButtonClass}>
      {children}
    </Link>
  )
}
