/** Constantes de la pantalla de carga de la carrera (specs/003-career-upload/data-model.md). */

/** URL del backend, sin `/` final. Sin `VITE_API_URL` apunta al backend local de desarrollo. */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

/** Replica el límite por defecto del backend (10 MB). Si cambia allá, actualizar acá. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/** Extensiones aceptadas, sin distinguir mayúsculas. */
export const ACCEPTED_EXTENSIONS = ['.pdf', '.xls'] as const

/** A los 10 s sin respuesta se avisa amablemente que puede demorar más de lo normal. */
export const SLOW_AFTER_MS = 10_000

/** A los 60 s se aborta y se trata como servicio no disponible. */
export const ABORT_AFTER_MS = 60_000
