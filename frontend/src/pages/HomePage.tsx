import { useNavigate } from 'react-router-dom';

const PASOS = [
  { num: 1, color: '#f9c5d1', texto: 'Cargá tu carrera' },
  { num: 2, color: '#a8dbc5', texto: 'Marcá tus materias' },
  { num: 3, color: '#a8cfe8', texto: 'Generá opciones de cursada' },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-surface">
      {/* Rainbow gradient fade at top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56"
        style={{
          background:
            'linear-gradient(180deg, rgba(249,168,212,0.35) 0%, rgba(253,186,116,0.25) 20%, rgba(253,230,138,0.2) 40%, rgba(110,231,183,0.2) 60%, rgba(147,197,253,0.2) 80%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-2xl flex-1 flex-col items-center px-6 pt-16 pb-12 text-center">
        {/* Logo + nombre */}
        <div className="mb-10 flex items-center gap-3">
          <svg width="72" height="72" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="39" height="39" rx="10" fill="#FFFFFF" stroke="#E6E2F0" />
            <path d="M28.5 11.5A12 12 0 1 0 28.5 28.5" stroke="#E58AA0" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M25.7 14.3A8 8 0 1 0 25.7 25.7" stroke="#E3C13F" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M22.8 17.2A4 4 0 1 0 22.8 22.8" stroke="#7DB8E0" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          <span
            style={{
              fontFamily: "'Montserrat', system-ui, sans-serif",
              fontWeight: 800,
              fontSize: '24px',
              color: '#8E4764',
              letterSpacing: '-0.5px',
            }}
          >
            Cuatri
          </span>
        </div>

        {/* Heading */}
        <h1 className="mb-5 text-5xl font-black leading-tight tracking-tight text-text-base md:text-6xl">
          Planificá tu cursada
          <br />
          <span style={{ color: '#e07b97' }}>sin volverte loca.</span>
        </h1>

        <p className="mb-10 max-w-md text-base leading-relaxed text-text-muted">
          Cargá tu carrera, marcá lo que aprobaste y Cuatri te muestra qué podés cursar, en qué
          orden y cuánto te queda.
        </p>

        {/* Paso pills */}
        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {PASOS.map((paso) => (
            <div
              key={paso.num}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-text-base"
              style={{ backgroundColor: paso.color }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white/60 text-xs font-bold"
              >
                {paso.num}
              </span>
              {paso.texto}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => void navigate('/cargar')}
          className="mb-5 flex items-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#c084a8' }}
        >
          <span className="text-xl leading-none">+</span>
          Cargar mi primera carrera
        </button>

        <p className="text-sm text-text-muted">
          O explorá{' '}
          <button
            onClick={() => void navigate('/cargar')}
            className="underline underline-offset-2 hover:opacity-75"
            style={{ color: '#c084a8' }}
          >
            un plan de ejemplo
          </button>{' '}
          para ver cómo funciona.
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pb-6 text-sm text-text-muted">
        Cuatri · Planificador de cursada universitaria
      </footer>
    </div>
  );
}
