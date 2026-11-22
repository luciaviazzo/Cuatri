import type { ExtractionErrorCode } from '../types/extraction'

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many)

/** Textos de la pantalla "Cargá tu carrera" (specs/003-career-upload/contracts/ui-contract.md). */
export const careerUploadCopy = {
  title: 'Cargá tu carrera',
  intro:
    'Subí el reporte «Plan de estudios» que descargás desde el sistema de la facultad (SIU Guaraní). Aceptamos PDF y Excel (.xls) de hasta 10 MB.',
  dropzoneTitle: 'Arrastrá tu archivo acá',
  dropzoneOr: 'o',
  chooseFile: 'Elegir archivo',
  dropActive: 'Soltá el archivo acá',
  changeFile: 'Cambiar archivo',
  analyze: 'Analizar mi plan',
  multipleDropped: (count: number) => `Soltaste ${count} archivos. Elegí cuál querés analizar:`,
  analyzing: 'Analizando tu plan…',
  slow: 'Esto está tardando un poco más de lo normal. ¡Ya casi!',

  resultTitle: 'Esto es lo que encontramos',
  program: 'Carrera',
  plan: 'Plan',
  version: 'Versión',
  found: (count: number, approved: number) =>
    `${count} ${plural(count, 'materia detectada', 'materias detectadas')} · ${approved} ${plural(approved, 'aprobada', 'aprobadas')}`,
  announce: (count: number, approved: number) =>
    `${count} ${plural(count, 'materia detectada', 'materias detectadas')}, ${approved} ${plural(approved, 'aprobada', 'aprobadas')}`,
  noModule: 'Sin módulo',
  moduleHeading: (name: string, count: number) => `${name} (${count})`,
  credits: (value: string) => `${value} créditos`,
  noData: 'sin dato',
  optional: 'Optativa',
  approved: (grade: string | null) => (grade ? `Aprobada · nota ${grade}` : 'Aprobada'),
  inProgress: 'En curso',
  noStatus: 'Sin estado',
  undeterminedNote:
    'El año del plan y las correlativas figuran como «sin determinar» porque el archivo no los trae. Más adelante vas a poder completarlos.',
  reviewNotice:
    'Este resultado es solo para revisar y todavía no se guarda. Si salís o recargás, vas a tener que volver a subir el archivo.',
  loadAnother: 'Cargar otro archivo',
  backHome: 'Volver al inicio',

  chooseOther: 'Elegir otro archivo',
  retry: 'Reintentar',
  errors: {
    invalid_file:
      'Ese archivo no parece un PDF ni un Excel (.xls) válido. Probá con el reporte «Plan de estudios» tal como lo descargaste.',
    empty_file: 'El archivo está vacío. Elegí otro.',
    file_too_large: 'El archivo pesa más de 10 MB. Elegí uno más liviano.',
    no_subjects_found:
      'No encontramos materias en ese archivo. Revisá que sea el reporte «Plan de estudios» y probá de nuevo.',
    service_unavailable:
      'No pudimos conectarnos con el servicio. Revisá tu conexión y probá de nuevo en un momento.',
  } satisfies Record<ExtractionErrorCode, string>,
} as const
