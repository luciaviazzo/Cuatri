/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Vitest no procesa CSS con ?raw (devuelve vacío), por eso se lee el archivo directamente.
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.css'), 'utf8')

/** Lee los tokens `--color-*` de index.css, la única fuente de verdad de los colores. */
function readTokens(source: string): Record<string, string> {
  const tokens: Record<string, string> = {}
  for (const match of source.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[match[1]] = match[2]
  }
  return tokens
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

const tokens = readTokens(css)
const RAINBOW = ['rosa', 'durazno', 'amarillo', 'verde', 'celeste', 'violeta', 'turquesa']

// [descripción, color del primer plano, color del fondo, contraste mínimo]
const PAIRS: [string, string, string, number][] = [
  ['texto principal sobre el fondo', 'ink', 'cream', 4.5],
  ['2ª línea del título y enlaces (rosa profundo) sobre el fondo', 'rose-deep', 'cream', 4.5],
  ['texto secundario sobre el fondo', 'ink-soft', 'cream', 4.5],
  ['texto del botón principal', 'ink', 'rose-powder', 4.5],
  ['borde del botón y anillo de foco sobre el fondo', 'rose-deep', 'cream', 3],
  ['anillo de foco sobre el botón principal', 'rose-deep', 'rose-powder', 3],
  ['texto principal sobre tarjetas blancas', 'ink', 'white', 4.5],
  ['texto secundario sobre tarjetas blancas', 'ink-soft', 'white', 4.5],
  ['rosa profundo sobre tarjetas blancas', 'rose-deep', 'white', 4.5],
  ['chip "Sin estado": texto secundario sobre el fondo', 'ink-soft', 'cream', 4.5],
  ['borde del área de carga sobre el fondo', 'control-border', 'cream', 3],
  ['borde del área de carga sobre blanco', 'control-border', 'white', 3],
  ['número del paso rosa', 'ink', 'rainbow-rosa-border', 4.5],
  ['número del paso verde', 'ink', 'rainbow-verde-border', 4.5],
  ['número del paso celeste', 'ink', 'rainbow-celeste-border', 4.5],
  ...RAINBOW.map(
    (name): [string, string, string, number] => [
      `texto oscuro sobre fondo pastel ${name}`,
      `rainbow-${name}-text`,
      `rainbow-${name}-bg`,
      4.5,
    ],
  ),
]

describe('tokens de la guía de estilo', () => {
  it('index.css define los tokens base, de marca y los siete pasteles completos', () => {
    for (const name of ['cream', 'white', 'ink', 'ink-soft', 'control-border', 'rose-powder', 'rose-deep', 'lavender']) {
      expect(tokens[name], name).toBeDefined()
    }
    for (const rainbow of RAINBOW) {
      for (const part of ['bg', 'border', 'text']) {
        expect(tokens[`rainbow-${rainbow}-${part}`], `${rainbow}-${part}`).toBeDefined()
      }
    }
  })

  it('el tema es `static`: se emiten todas las variables aunque ninguna clase las use', () => {
    // La franja arcoíris lee los siete fondos con var() desde JS; sin `static` Tailwind descarta
    // durazno, violeta y turquesa y el degradé desaparece.
    expect(css).toMatch(/@theme\s+static\s*\{/)
  })

  it.each(PAIRS)('%s cumple el contraste mínimo', (_description, fg, bg, minimum) => {
    expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(minimum)
  })

  it('el rosa del mockup y el azul lavanda no alcanzan para texto ni foco sobre el fondo', () => {
    // Documenta por qué se usa rosa profundo: estos pares NO deben usarse para texto ni foco.
    expect(contrast(tokens['rainbow-rosa-border'], tokens['cream'])).toBeLessThan(3)
    expect(contrast(tokens['lavender'], tokens['cream'])).toBeLessThan(3)
  })
})
