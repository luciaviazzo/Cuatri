import type { ParsedMateria } from './materia.js';

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export function parsePlanFile(raw: unknown): ParsedMateria[] {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !Array.isArray((raw as Record<string, unknown>)['materias'])
  ) {
    throw new ParseError('El archivo debe tener un campo "materias" con un array.');
  }

  const { materias } = raw as { materias: unknown[] };

  if (materias.length === 0) {
    throw new ParseError('El archivo no contiene materias.');
  }

  return materias.map((m, i) => {
    if (typeof m !== 'object' || m === null) {
      throw new ParseError(`El elemento en la posición ${i} no es un objeto válido.`);
    }
    const item = m as Record<string, unknown>;

    if (typeof item['nombre'] !== 'string' || item['nombre'].trim() === '') {
      throw new ParseError(
        `La materia en la posición ${i} no tiene nombre o está vacío.`,
      );
    }

    if (
      typeof item['anio'] !== 'number' ||
      !Number.isInteger(item['anio']) ||
      item['anio'] < 1
    ) {
      throw new ParseError(
        `La materia "${item['nombre'] as string}" no tiene año asignado o es inválido (debe ser entero ≥ 1).`,
      );
    }

    const correlativas = item['correlativas'];
    if (correlativas !== undefined && !Array.isArray(correlativas)) {
      throw new ParseError(
        `La materia "${item['nombre'] as string}" tiene un campo "correlativas" que no es un array.`,
      );
    }

    const correlativasNombres: string[] = [];
    if (Array.isArray(correlativas)) {
      for (const c of correlativas) {
        if (typeof c !== 'string' || c.trim() === '') {
          throw new ParseError(
            `La materia "${item['nombre'] as string}" tiene una correlativa vacía o no válida.`,
          );
        }
        correlativasNombres.push(c.trim());
      }
    }

    return {
      nombre: (item['nombre'] as string).trim(),
      anio: item['anio'] as number,
      correlativasNombres,
    };
  });
}
