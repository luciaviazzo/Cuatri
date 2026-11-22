import type { ExtractionResult } from './plan'

export type ExtractionErrorCode =
  | 'invalid_file'
  | 'empty_file'
  | 'file_too_large'
  | 'no_subjects_found'
  | 'service_unavailable'

/** Estado de la pantalla de carga (specs/003-career-upload/data-model.md). */
export type ExtractionState =
  | { status: 'idle' }
  | { status: 'selected'; file: File }
  | { status: 'analyzing'; file: File; slow: boolean }
  | { status: 'success'; result: ExtractionResult }
  | { status: 'error'; code: ExtractionErrorCode; file: File | null; canRetry: boolean }
