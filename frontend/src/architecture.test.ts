import { describe, expect, it } from 'vitest'

/**
 * Reglas de capas del frontend (Principio II). import-linter solo revisa Python, así que se
 * verifican acá: la vista y los componentes no acceden a la red ni a service/, solo service/ usa
 * fetch, los colores viven solo en los tokens de index.css y no se guarda nada en el dispositivo.
 */
// import.meta.glob exige patrones literales: no se puede reutilizar una función auxiliar.
const ui = import.meta.glob(
  ['./components/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>
const logic = import.meta.glob(
  ['./hooks/**/*.{ts,tsx}', './utils/**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>
const service = import.meta.glob(['./service/**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const everything = { ...ui, ...logic, ...service }

describe('arquitectura del frontend', () => {
  it('hay archivos de cada capa para verificar', () => {
    expect(Object.keys(ui).length).toBeGreaterThan(0)
    expect(Object.keys(logic).length).toBeGreaterThan(0)
    expect(Object.keys(service).length).toBeGreaterThan(0)
  })

  it.each(Object.entries({ ...ui, ...logic }))('%s no llama a la red directamente', (_path, code) => {
    expect(code).not.toMatch(/\bfetch\s*\(/)
    expect(code).not.toMatch(/\bXMLHttpRequest\b|\baxios\b/)
  })

  it.each(Object.entries(ui))('%s no importa service/', (_path, code) => {
    expect(code).not.toMatch(/from\s+['"][^'"]*\/service\//)
  })

  it.each(Object.entries(ui))('%s no tiene colores hexadecimales sueltos', (_path, code) => {
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it.each(Object.entries(everything))(
    '%s no guarda nada en el dispositivo ni escribe en consola',
    (_path, code) => {
      expect(code).not.toMatch(/\b(localStorage|sessionStorage|indexedDB)\b/)
      expect(code).not.toMatch(/\bconsole\./)
    },
  )
})
