const base =
  'inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-rose-deep px-6 py-3 font-display text-base font-bold transition-[background-color] sm:px-8 sm:py-4 sm:text-lg'

/** Acción principal: relleno rosa empolvado, texto principal (6,2:1) y borde rosa profundo. */
export const primaryButtonClass = `${base} bg-rose-powder text-ink hover:bg-rose-powder/70`

/** Acción secundaria: fondo blanco y texto rosa profundo (6,6:1). */
export const secondaryButtonClass = `${base} bg-white text-rose-deep hover:bg-rose-powder/30`
