import { describe, expect, it } from 'vitest';
import { DomainError, buildPlanDeEstudios } from '../../src/domain/build-plan-de-estudios.js';

const carreraId = 'carrera-uuid-1';

describe('buildPlanDeEstudios', () => {
  it('lanza DomainError si la lista está vacía', () => {
    expect(() => buildPlanDeEstudios([], carreraId)).toThrow(DomainError);
    expect(() => buildPlanDeEstudios([], carreraId)).toThrow('al menos una materia');
  });

  it('lanza DomainError si hay nombres duplicados', () => {
    expect(() =>
      buildPlanDeEstudios(
        [
          { nombre: 'Física', anio: 1, correlativasNombres: [] },
          { nombre: 'Física', anio: 2, correlativasNombres: [] },
        ],
        carreraId,
      ),
    ).toThrow(DomainError);
  });

  it('lanza DomainError si una correlativa referencia nombre inexistente', () => {
    expect(() =>
      buildPlanDeEstudios(
        [{ nombre: 'Álgebra II', anio: 2, correlativasNombres: ['Álgebra I'] }],
        carreraId,
      ),
    ).toThrow(DomainError);
  });

  it('lanza DomainError con el nombre faltante en el mensaje', () => {
    expect(() =>
      buildPlanDeEstudios(
        [{ nombre: 'Álgebra II', anio: 2, correlativasNombres: ['Álgebra I'] }],
        carreraId,
      ),
    ).toThrow('"Álgebra I"');
  });

  it('lanza DomainError si hay ciclo A→B→A', () => {
    expect(() =>
      buildPlanDeEstudios(
        [
          { nombre: 'A', anio: 1, correlativasNombres: ['B'] },
          { nombre: 'B', anio: 1, correlativasNombres: ['A'] },
        ],
        carreraId,
      ),
    ).toThrow(DomainError);
  });

  it('el mensaje de error del ciclo incluye los nombres involucrados', () => {
    try {
      buildPlanDeEstudios(
        [
          { nombre: 'MatA', anio: 1, correlativasNombres: ['MatB'] },
          { nombre: 'MatB', anio: 1, correlativasNombres: ['MatA'] },
        ],
        carreraId,
      );
      expect.fail('debería haber lanzado');
    } catch (e) {
      expect((e as Error).message).toContain('MatA');
      expect((e as Error).message).toContain('MatB');
    }
  });

  it('construye plan válido sin correlativas', () => {
    const result = buildPlanDeEstudios(
      [
        { nombre: 'Álgebra', anio: 1, correlativasNombres: [] },
        { nombre: 'Física', anio: 1, correlativasNombres: [] },
      ],
      carreraId,
    );
    expect(result.carreraId).toBe(carreraId);
    expect(result.materias).toHaveLength(2);
    expect(result.materias[0].correlativaIds).toHaveLength(0);
  });

  it('construye plan válido con correlativas y resuelve IDs', () => {
    const result = buildPlanDeEstudios(
      [
        { nombre: 'Álgebra', anio: 1, correlativasNombres: [] },
        { nombre: 'Álgebra II', anio: 2, correlativasNombres: ['Álgebra'] },
      ],
      carreraId,
    );
    const alg = result.materias.find((m) => m.nombre === 'Álgebra')!;
    const algII = result.materias.find((m) => m.nombre === 'Álgebra II')!;
    expect(algII.correlativaIds).toContain(alg.tempId);
  });
});
