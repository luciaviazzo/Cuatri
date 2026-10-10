import type { MateriaDetalle } from '../types/plan.js';

interface Props {
  materia: MateriaDetalle;
  onConfigClick?: () => void;
}

export function MateriaCard({ materia, onConfigClick }: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-text-base">{materia.nombre}</h3>
          <p className="text-sm text-text-muted">Año {materia.anio}</p>
        </div>
        {!materia.correlativasCompletas && (
          <span className="shrink-0 rounded-full bg-accent-yellow px-2 py-0.5 text-xs font-medium text-text-base">
            Pendiente de configuración
          </span>
        )}
      </div>

      {materia.correlativas.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-text-muted uppercase tracking-wide">
            Correlativas
          </p>
          <ul className="flex flex-wrap gap-1">
            {materia.correlativas.map((c) => (
              <li
                key={c.id}
                className="rounded-full bg-surface-alt border border-border px-2 py-0.5 text-xs text-text-base"
              >
                {c.nombre}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onConfigClick && (
        <button
          onClick={onConfigClick}
          className="mt-3 text-xs text-primary underline hover:no-underline"
        >
          Configurar correlativas
        </button>
      )}
    </div>
  );
}
