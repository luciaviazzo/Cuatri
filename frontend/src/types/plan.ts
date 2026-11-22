/** Espejo del contrato de POST /planes/extraccion (feature 001). Los decimales llegan como texto. */

export interface PlanInfo {
  program: string | null
  plan: string | null
  version: string | null
}

export interface Requisito {
  kind: 'subject' | 'unparsed'
  text: string
}

export interface Estado {
  kind: 'approved' | 'in_progress' | 'unparsed'
  /** Solo con `approved`, por ejemplo "9". */
  grade: string | null
  /** Solo con `approved`, por ejemplo "Promocionado". */
  condition: string | null
  /** Solo con `unparsed`: texto literal del archivo. */
  text: string | null
}

export interface Materia {
  code: string | null
  name: string
  activity_type: string | null
  /** Texto decimal, por ejemplo "10.00". */
  credits: string | null
  /** Módulo o bloque donde figura; `null` si no tiene. */
  group: string | null
  is_elective: boolean
  /** Año del plan: `null` = sin asignar (siempre, con el formato de SIU). */
  year: number | null
  reported_year: string | null
  reported_term: string | null
  origin: string | null
  /** `null` = sin determinar (siempre, con el formato de SIU). */
  prerequisites: Requisito[] | null
  status: Estado | null
}

export interface ExtractionResult {
  plan_info: PlanInfo
  subjects: Materia[]
}
