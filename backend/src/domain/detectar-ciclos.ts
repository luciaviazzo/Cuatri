type CycleResult =
  | { hasCycle: false }
  | { hasCycle: true; cycle: string[] };

export function detectarCiclos(grafo: Map<string, string[]>): CycleResult {
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string, path: string[]): string[] | null {
    visited.add(node);
    inStack.add(node);

    for (const neighbor of grafo.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        const cycle = dfs(neighbor, [...path, neighbor]);
        if (cycle !== null) return cycle;
      } else if (inStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        return [...path.slice(cycleStart), neighbor];
      }
    }

    inStack.delete(node);
    return null;
  }

  for (const node of grafo.keys()) {
    if (!visited.has(node)) {
      const cycle = dfs(node, [node]);
      if (cycle !== null) {
        return { hasCycle: true, cycle };
      }
    }
  }

  return { hasCycle: false };
}
