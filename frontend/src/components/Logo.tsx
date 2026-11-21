import { homeCopy } from '../pages/homeCopy'

/** Logo de Cuatri. El tamaño se declara para evitar saltos de layout al cargar. */
export function Logo() {
  return <img src="/logo.svg" alt={homeCopy.logoAlt} width={72} height={72} className="size-14 sm:size-[72px]" />
}
