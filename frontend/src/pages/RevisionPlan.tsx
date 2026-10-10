import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CorrelativaForm } from '../components/CorrelativaForm.js';
import { MateriaCard } from '../components/MateriaCard.js';
import { usePlan } from '../hooks/usePlan.js';
import type { MateriaDetalle, PlanDeEstudiosDetalle } from '../types/plan.js';

export function RevisionPlan() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPlan = (location.state as { plan?: PlanDeEstudiosDetalle } | null)?.plan ?? null;
  const { plan: hookPlan, agregarCorrelativa, quitarCorrelativa } = usePlan();
  const plan = hookPlan ?? initialPlan;

  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!plan) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <p className="text-text-muted">No hay plan cargado.</p>
        <button
          onClick={() => void navigate('/')}
          className="mt-4 text-primary underline"
        >
          Cargar plan
        </button>
      </main>
    );
  }

  const porAnio = plan.materias.reduce<Record<number, MateriaDetalle[]>>((acc, m) => {
    (acc[m.anio] ??= []).push(m);
    return acc;
  }, {});

  const anios = Object.keys(porAnio)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-base">Plan de estudios</h1>
        <button onClick={() => void navigate('/')} className="text-sm text-primary underline">
          Cargar otro plan
        </button>
      </div>

      {anios.map((anio) => (
        <section key={anio} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-text-muted">Año {anio}</h2>
          <div className="space-y-3">
            {porAnio[anio].map((materia) => (
              <div key={materia.id}>
                <MateriaCard
                  materia={materia}
                  onConfigClick={() =>
                    setExpandedId((prev) => (prev === materia.id ? null : materia.id))
                  }
                />
                {expandedId === materia.id && (
                  <CorrelativaForm
                    materia={materia}
                    todasLasMaterias={plan.materias}
                    onAdd={(correlativaId) =>
                      agregarCorrelativa(plan.carreraId, materia.id, correlativaId)
                    }
                    onRemove={(correlativaId) =>
                      quitarCorrelativa(plan.carreraId, materia.id, correlativaId)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
