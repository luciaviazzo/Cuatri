import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout.js';

function StepperIcon({ num, active }: { num: number; active: boolean }) {
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
      style={
        active
          ? { backgroundColor: '#c084a8', color: '#fff' }
          : { backgroundColor: 'transparent', color: '#9ca3af', border: '1.5px solid #d1d5db' }
      }
    >
      {num}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const pasos = ['Subir PDF', 'Revisar', 'Listo'];
  return (
    <div className="mb-5 flex items-center">
      {pasos.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-0.5">
            <StepperIcon num={i + 1} active={step === i + 1} />
            <span className="text-xs font-medium" style={{ color: step === i + 1 ? '#8E4764' : '#9ca3af' }}>
              {label}
            </span>
          </div>
          {i < pasos.length - 1 && <div className="mb-4 h-px w-20 bg-gray-200 sm:w-36" />}
        </div>
      ))}
    </div>
  );
}

const PILL_COLORS = ['#f9c5d1', '#a8dbc5', '#c4b5fd'];

const INSTRUCCIONES = [
  {
    titulo: 'Entrá al SIU Guaraní',
    desc: 'Iniciá sesión con tu usuario y contraseña de la facultad.',
  },
  {
    titulo: <>Andá a Reportes → Plan de estudios</>,
    desc: <>En el menú principal encontrarás la sección <strong>Reportes</strong>. Dentro, elegí <strong>Plan de estudios</strong>.</>,
  },
  {
    titulo: 'Descargá como PDF',
    desc: 'Usá el botón de descarga o imprimí la página como PDF desde el navegador.',
  },
];

export function CargarPlan() {
  const navigate = useNavigate();

  const volverBtn = (
    <button
      onClick={() => void navigate('/')}
      className="rounded-2xl border border-border px-5 py-2 text-sm font-medium text-text-muted transition-colors hover:border-primary/40 hover:text-text-base"
    >
      ← Volver
    </button>
  );

  return (
    <Layout rightAction={volverBtn}>
      <div className="mx-auto max-w-2xl px-6 py-6">
        <p className="mb-0.5 text-sm text-text-muted">Paso 1 de 3</p>
        <h1 className="mb-5 text-2xl font-bold text-text-base">Subí el plan de estudios</h1>

        <Stepper step={1} />

        <div className="space-y-3">
          {/* Drop zone — placeholder hasta spec PDF */}
          <div
            className="rounded-2xl border-2 border-dashed py-7 text-center"
            style={{ borderColor: '#bfdbfe', backgroundColor: '#f0f9ff' }}
          >
            <div
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: '#a8cfe8' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4M8 8l4-4 4 4" />
                <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
              </svg>
            </div>
            <p className="mb-1 text-sm font-semibold text-text-base">Subí el PDF del plan de estudios</p>
            <p className="mb-3 text-sm text-text-muted">Arrastrá el archivo acá o hacé click para seleccionarlo</p>
            <span className="rounded-full px-3 py-0.5 text-xs font-medium" style={{ backgroundColor: '#bfdbfe', color: '#1e40af' }}>
              PDF · hasta 20 MB
            </span>
          </div>

          {/* Instrucciones SIU Guaraní */}
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: '#fde68a' }}>
              <span className="text-sm">ⓘ</span>
              <p className="text-sm font-semibold text-text-base">¿Cómo descargo el PDF desde el SIU Guaraní?</p>
            </div>
            <div className="divide-y divide-border bg-white">
              {INSTRUCCIONES.map((paso, i) => (
                <div key={i} className="flex gap-3 px-4 py-3">
                  <div
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-text-base"
                    style={{ backgroundColor: PILL_COLORS[i] }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-base">{paso.titulo}</p>
                    <p className="text-xs text-text-muted">{paso.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
