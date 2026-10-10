import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { detectarCiclos } from '../../src/domain/detectar-ciclos.js';

describe('detectarCiclos', () => {
  it('grafo vacío no tiene ciclo', () => {
    expect(detectarCiclos(new Map())).toEqual({ hasCycle: false });
  });

  it('nodo sin aristas no tiene ciclo', () => {
    const g = new Map([['A', []]]);
    expect(detectarCiclos(g)).toEqual({ hasCycle: false });
  });

  it('auto-referencia A→A es ciclo', () => {
    const g = new Map([['A', ['A']]]);
    const result = detectarCiclos(g);
    expect(result.hasCycle).toBe(true);
  });

  it('ciclo directo A→B→A', () => {
    const g = new Map([
      ['A', ['B']],
      ['B', ['A']],
    ]);
    const result = detectarCiclos(g);
    expect(result.hasCycle).toBe(true);
    if (result.hasCycle) {
      expect(result.cycle).toContain('A');
      expect(result.cycle).toContain('B');
    }
  });

  it('ciclo indirecto A→B→C→A', () => {
    const g = new Map([
      ['A', ['B']],
      ['B', ['C']],
      ['C', ['A']],
    ]);
    const result = detectarCiclos(g);
    expect(result.hasCycle).toBe(true);
  });

  it('A→B, A→C sin ciclo', () => {
    const g = new Map([
      ['A', ['B', 'C']],
      ['B', []],
      ['C', []],
    ]);
    expect(detectarCiclos(g)).toEqual({ hasCycle: false });
  });

  it('cadena larga sin ciclo', () => {
    const g = new Map([
      ['A', ['B']],
      ['B', ['C']],
      ['C', ['D']],
      ['D', []],
    ]);
    expect(detectarCiclos(g)).toEqual({ hasCycle: false });
  });

  it('DAG con diamante sin ciclo', () => {
    const g = new Map([
      ['A', ['B', 'C']],
      ['B', ['D']],
      ['C', ['D']],
      ['D', []],
    ]);
    expect(detectarCiclos(g)).toEqual({ hasCycle: false });
  });

  it('property: grafo vacío nunca tiene ciclo', () => {
    fc.assert(
      fc.property(fc.constant(new Map<string, string[]>()), (g) => {
        return !detectarCiclos(g).hasCycle;
      }),
    );
  });

  it('property: DAG topológico nunca tiene ciclo', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 5 }), { minLength: 2, maxLength: 8 }),
        (nodes) => {
          const unique = [...new Set(nodes)];
          if (unique.length < 2) return true;
          const g = new Map<string, string[]>();
          for (let i = 0; i < unique.length; i++) {
            // Cada nodo i solo puede apuntar a nodos con índice mayor → nunca hay ciclo
            const targets = unique.slice(i + 1);
            g.set(unique[i], targets.slice(0, 2));
          }
          g.set(unique[unique.length - 1], []);
          return !detectarCiclos(g).hasCycle;
        },
      ),
    );
  });

  it('property: grafo con arista de vuelta siempre detecta ciclo', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 5 }),
        fc.string({ minLength: 1, maxLength: 5 }),
        (a, b) => {
          if (a === b) return true;
          const g = new Map<string, string[]>([
            [a, [b]],
            [b, [a]],
          ]);
          return detectarCiclos(g).hasCycle;
        },
      ),
    );
  });
});
