const number = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })
const sizeNumber = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })

/** "10.00" → "10", "4.50" → "4,5"; sin dato → "sin dato"; un texto que no es número se muestra tal cual. */
export function formatCredits(credits: string | null): string {
  if (credits === null) return 'sin dato'
  const value = Number(credits)
  return Number.isFinite(value) && credits.trim() !== '' ? number.format(value) : credits
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${sizeNumber.format(bytes / 1024)} KB`
  return `${sizeNumber.format(bytes / (1024 * 1024))} MB`
}
