const RAINBOW = ['rosa', 'durazno', 'amarillo', 'verde', 'turquesa', 'celeste', 'violeta'] as const

const GRADIENT = `linear-gradient(to right, ${RAINBOW.map(
  (name) => `var(--color-rainbow-${name}-bg)`,
).join(', ')})`

/** Franja fina decorativa con los siete pasteles del arcoíris, en el borde superior de la página. */
export function RainbowStripe() {
  return <div aria-hidden="true" className="h-1.5 w-full" style={{ background: GRADIENT }} />
}
