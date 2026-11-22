import { describe, expect, it } from 'vitest'
import { MAX_UPLOAD_BYTES } from '../config'
import { validateFile } from './validateFile'

function fileOf(name: string, size: number): File {
  return new File([new Uint8Array(size)], name)
}

describe('validateFile', () => {
  it('un archivo vacío es empty_file', () => {
    expect(validateFile(fileOf('plan.pdf', 0))).toBe('empty_file')
  })

  it('un archivo que supera el máximo es file_too_large', () => {
    expect(validateFile(fileOf('plan.pdf', MAX_UPLOAD_BYTES + 1))).toBe('file_too_large')
  })

  it('el tamaño exacto del máximo es válido', () => {
    expect(validateFile(fileOf('plan.pdf', MAX_UPLOAD_BYTES))).toBeNull()
  })

  it.each(['plan.png', 'plan.doc', 'plan.xlsx', 'plan', 'plan.pdf.exe'])(
    'la extensión de %s no es aceptada',
    (name) => {
      expect(validateFile(fileOf(name, 10))).toBe('invalid_file')
    },
  )

  it.each(['plan.pdf', 'PLAN.PDF', 'plan.xls', 'Plan.XLS', 'mi plan 2019.pdf'])(
    '%s es válido (sin distinguir mayúsculas)',
    (name) => {
      expect(validateFile(fileOf(name, 10))).toBeNull()
    },
  )

  it('si falla más de una cosa, informa primero que está vacío', () => {
    expect(validateFile(fileOf('plan.png', 0))).toBe('empty_file')
  })
})
