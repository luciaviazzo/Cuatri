import { detectarCiclos } from './detectar-ciclos.js';
import type { ParsedMateria } from './materia.js';

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export interface BuiltMateria {
  tempId: string;
  nombre: string;
  anio: number;
  correlativaIds: string[];
}

export interface BuiltPlan {
  carreraId: string;
  materias: BuiltMateria[];
}

export function buildPlanDeEstudios(
  materias: ParsedMateria[],
  carreraId: string,
): BuiltPlan {
  if (materias.length === 0) {
    throw new DomainError('El plan debe contener al menos una materia.');
  }

  const nombres = materias.map((m) => m.nombre);
  const duplicado = nombres.find((n, i) => nombres.indexOf(n) !== i);
  if (duplicado !== undefined) {
    throw new DomainError(
      `El plan tiene dos materias con el mismo nombre: "${duplicado}".`,
    );
  }

  const nombreAId = new Map<string, string>();
  materias.forEach((m, i) => {
    nombreAId.set(m.nombre, `temp-${i}`);
  });

  for (const m of materias) {
    for (const c of m.correlativasNombres) {
      if (!nombreAId.has(c)) {
        throw new DomainError(
          `La materia "${m.nombre}" referencia como correlativa a "${c}", que no existe en el plan.`,
        );
      }
    }
  }

  const grafo = new Map<string, string[]>();
  for (const m of materias) {
    const id = nombreAId.get(m.nombre)!;
    grafo.set(id, m.correlativasNombres.map((c) => nombreAId.get(c)!));
  }

  const ciclo = detectarCiclos(grafo);
  if (ciclo.hasCycle) {
    const cicloNombres = ciclo.cycle.map((tempId) => {
      const entry = [...nombreAId.entries()].find(([, v]) => v === tempId);
      return entry ? entry[0] : tempId;
    });
    throw new DomainError(
      `Se detectó un ciclo de dependencias: ${cicloNombres.join(' → ')}.`,
    );
  }

  const materiasBuilt: BuiltMateria[] = materias.map((m, i) => ({
    tempId: `temp-${i}`,
    nombre: m.nombre,
    anio: m.anio,
    correlativaIds: m.correlativasNombres.map((c) => nombreAId.get(c)!),
  }));

  return {
    carreraId,
    materias: materiasBuilt,
  };
}
