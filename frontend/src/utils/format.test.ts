import { describe, expect, it } from 'vitest'
import { formatCredits, formatFileSize } from './format'

describe('formatCredits', () => {
  it.each([
    ['10.00', '10'],
    ['8.00', '8'],
    ['4.50', '4,5'],
    ['12', '12'],
    ['0.00', '0'],
  ])('%s se muestra como %s', (input, expected) => {
    expect(formatCredits(input)).toBe(expected)
  })

  it('sin dato devuelve "sin dato"', () => {
    expect(formatCredits(null)).toBe('sin dato')
  })

  it('un texto que no es número se muestra tal cual, sin inventar valores', () => {
    expect(formatCredits('n/d')).toBe('n/d')
  })
})

describe('formatFileSize', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1024, '1 KB'],
    [1536, '1,5 KB'],
    [24 * 1024, '24 KB'],
    [1024 * 1024, '1 MB'],
    [10 * 1024 * 1024, '10 MB'],
    [3.25 * 1024 * 1024, '3,3 MB'],
  ])('%s bytes se muestra como %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected)
  })
})
