import { useState } from 'react';
import type { MateriaDetalle } from '../types/plan.js';

interface Props {
  materia: MateriaDetalle;
  todasLasMaterias: MateriaDetalle[];
  onAdd: (correlativaId: string) => Promise<void>;
  onRemove: (correlativaId: string) => Promise<void>;
}

export function CorrelativaForm({ materia, todasLasMaterias, onAdd, onRemove }: Props) {
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingIds = new Set(materia.correlativas.map((c) => c.id));
  const opciones = todasLasMaterias.filter(
    (m) => m.id !== materia.id && !existingIds.has(m.id),
  );

  async function handleAdd() {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      await onAdd(selectedId);
      setSelectedId('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al agregar');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(correlativaId: string) {
    setLoading(true);
    setError(null);
    try {
      await onRemove(correlativaId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al quitar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-surface-alt p-3">
      <p className="mb-2 text-xs font-semibold text-text-muted uppercase tracking-wide">
        Editar correlativas
      </p>

      {materia.correlativas.length > 0 && (
        <ul className="mb-3 space-y-1">
          {materia.correlativas.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-sm text-text-base">
              <span>{c.nombre}</span>
              <button
                onClick={() => void handleRemove(c.id)}
                disabled={loading}
                className="ml-2 text-accent-red hover:underline text-xs"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {opciones.length > 0 && (
        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 rounded border border-border bg-white px-2 py-1 text-sm text-text-base"
          >
            <option value="">Seleccionar materia…</option>
            {opciones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} (Año {m.anio})
              </option>
            ))}
          </select>
          <button
            onClick={() => void handleAdd()}
            disabled={!selectedId || loading}
            className="rounded bg-primary px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-accent-red">{error}</p>}
    </div>
  );
}
