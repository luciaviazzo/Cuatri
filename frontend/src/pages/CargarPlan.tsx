import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCarreras } from '../service/plan.js';
import type { CarreraResumen } from '../types/plan.js';
import { usePlan } from '../hooks/usePlan.js';

export function CargarPlan() {
  const [carreras, setCarreras] = useState<CarreraResumen[]>([]);
  const [carreraId, setCarreraId] = useState('');
  const [carrerasError, setCarrerasError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { loading, error, cargarPlan, plan } = usePlan();

  useEffect(() => {
    getCarreras()
      .then(setCarreras)
      .catch(() => setCarrerasError('No se pudieron cargar las carreras'));
  }, []);

  useEffect(() => {
    if (plan) {
      void navigate('/revision', { state: { plan } });
    }
  }, [plan, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !carreraId) return;
    await cargarPlan(carreraId, file);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-text-base">Cargar plan de estudios</h1>

      {carrerasError && (
        <p className="mb-4 rounded bg-accent-red/20 p-3 text-sm text-text-base">{carrerasError}</p>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">Carrera</label>
          <select
            value={carreraId}
            onChange={(e) => setCarreraId(e.target.value)}
            required
            className="w-full rounded border border-border bg-white px-3 py-2 text-text-base"
          >
            <option value="">Seleccionar carrera…</option>
            {carreras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">
            Archivo del plan (.json)
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            required
            className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text-base"
          />
        </div>

        {error && (
          <p className="rounded bg-accent-red/20 p-3 text-sm text-text-base">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Cargando…' : 'Cargar plan'}
        </button>
      </form>
    </main>
  );
}
