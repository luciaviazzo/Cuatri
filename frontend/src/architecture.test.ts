import { describe, expect, it } from 'vitest'

/**
 * Reglas de capas del frontend (Principio II). import-linter solo revisa Python, así que se
 * verifican acá: la vista y los componentes no acceden a la red ni a service/, y los colores
 * viven solo en los tokens de index.css.
 */
const sources = import.meta.glob(
  ['./components/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

describe('arquitectura del frontend', () => {
  it('hay archivos de pages/ y components/ para verificar', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(0)
  })

  it.each(Object.entries(sources))('%s no llama a la red ni importa service/', (_path, code) => {
    expect(code).not.toMatch(/\bfetch\s*\(/)
    expect(code).not.toMatch(/from\s+['"][^'"]*\/service\//)
    expect(code).not.toMatch(/\bXMLHttpRequest\b|\baxios\b/)
  })

  it.each(Object.entries(sources))('%s no tiene colores hexadecimales sueltos', (_path, code) => {
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
