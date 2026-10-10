import { useState } from 'react';
import {
  addCorrelativa,
  getPlan,
  removeCorrelativa,
  uploadPlan,
} from '../service/plan.js';
import type { MateriaDetalle, PlanDeEstudiosDetalle } from '../types/plan.js';

export function usePlan() {
  const [plan, setPlan] = useState<PlanDeEstudiosDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargarPlan(carreraId: string, file: File): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const result = await uploadPlan(carreraId, file);
      setPlan(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlan(carreraId: string): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const result = await getPlan(carreraId);
      setPlan(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  function updateMateriaEnPlan(materia: MateriaDetalle): void {
    setPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        materias: prev.materias.map((m) => (m.id === materia.id ? materia : m)),
      };
    });
  }

  async function agregarCorrelativa(
    carreraId: string,
    materiaId: string,
    correlativaId: string,
  ): Promise<void> {
    const updated = await addCorrelativa(carreraId, materiaId, correlativaId);
    updateMateriaEnPlan(updated);
  }

  async function quitarCorrelativa(
    carreraId: string,
    materiaId: string,
    correlativaId: string,
  ): Promise<void> {
    const updated = await removeCorrelativa(carreraId, materiaId, correlativaId);
    updateMateriaEnPlan(updated);
  }

  return { plan, loading, error, cargarPlan, fetchPlan, agregarCorrelativa, quitarCorrelativa };
}
