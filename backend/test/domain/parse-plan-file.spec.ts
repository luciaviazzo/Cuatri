import { describe, expect, it } from 'vitest';
import { ParseError, parsePlanFile } from '../../src/domain/parse-plan-file.js';

describe('parsePlanFile', () => {
  it('parsea un plan válido sin correlativas', () => {
    const result = parsePlanFile({
      materias: [
        { nombre: 'Álgebra', anio: 1, correlativas: [] },
        { nombre: 'Análisis I', anio: 1 },
      ],
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ nombre: 'Álgebra', anio: 1, correlativasNombres: [] });
    expect(result[1]).toEqual({ nombre: 'Análisis I', anio: 1, correlativasNombres: [] });
  });

  it('parsea un plan válido con correlativas', () => {
    const result = parsePlanFile({
      materias: [
        { nombre: 'Álgebra', anio: 1, correlativas: [] },
        { nombre: 'Análisis II', anio: 2, correlativas: ['Álgebra'] },
      ],
    });
    expect(result[1].correlativasNombres).toEqual(['Álgebra']);
  });

  it('ignora campos extra en cada materia', () => {
    const result = parsePlanFile({
      materias: [{ nombre: 'Física', anio: 1, descripcion: 'extra', correlativas: [] }],
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ nombre: 'Física', anio: 1, correlativasNombres: [] });
  });

  it('lanza ParseError si no hay campo materias', () => {
    expect(() => parsePlanFile({ otro: [] })).toThrow(ParseError);
  });

  it('lanza ParseError si materias no es array', () => {
    expect(() => parsePlanFile({ materias: 'no-array' })).toThrow(ParseError);
  });

  it('lanza ParseError si el array está vacío', () => {
    expect(() => parsePlanFile({ materias: [] })).toThrow(ParseError);
    expect(() => parsePlanFile({ materias: [] })).toThrow('no contiene materias');
  });

  it('lanza ParseError si una materia no tiene nombre', () => {
    expect(() =>
      parsePlanFile({ materias: [{ anio: 1, correlativas: [] }] }),
    ).toThrow(ParseError);
  });

  it('lanza ParseError si el nombre está vacío', () => {
    expect(() =>
      parsePlanFile({ materias: [{ nombre: '  ', anio: 1 }] }),
    ).toThrow(ParseError);
  });

  it('lanza ParseError si anio es 0', () => {
    expect(() =>
      parsePlanFile({ materias: [{ nombre: 'Física', anio: 0 }] }),
    ).toThrow(ParseError);
  });

  it('lanza ParseError si anio no es entero', () => {
    expect(() =>
      parsePlanFile({ materias: [{ nombre: 'Física', anio: 1.5 }] }),
    ).toThrow(ParseError);
  });

  it('lanza ParseError si anio no es número', () => {
    expect(() =>
      parsePlanFile({ materias: [{ nombre: 'Física', anio: '1' }] }),
    ).toThrow(ParseError);
  });

  it('lanza ParseError si correlativas no es array', () => {
    expect(() =>
      parsePlanFile({ materias: [{ nombre: 'Física', anio: 1, correlativas: 'mal' }] }),
    ).toThrow(ParseError);
  });

  it('lanza ParseError si una correlativa está vacía', () => {
    expect(() =>
      parsePlanFile({ materias: [{ nombre: 'Física', anio: 1, correlativas: [''] }] }),
    ).toThrow(ParseError);
  });

  it('recorta espacios del nombre', () => {
    const result = parsePlanFile({ materias: [{ nombre: '  Física  ', anio: 1 }] });
    expect(result[0].nombre).toBe('Física');
  });
});
