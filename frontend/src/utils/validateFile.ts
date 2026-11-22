import { ACCEPTED_EXTENSIONS, MAX_UPLOAD_BYTES } from '../config'
import type { ExtractionErrorCode } from '../types/extraction'

/**
 * Control previo, orientativo: ahorra un viaje de red y da el aviso inmediato. El servicio decide
 * por el contenido real (una imagen renombrada .pdf pasa este control y la rechaza el servicio).
 */
export function validateFile(file: File): ExtractionErrorCode | null {
  if (file.size === 0) return 'empty_file'
  if (file.size > MAX_UPLOAD_BYTES) return 'file_too_large'
  const name = file.name.toLowerCase()
  const accepted = ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension))
  return accepted ? null : 'invalid_file'
}
