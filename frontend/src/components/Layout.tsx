import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function Layout({ children, rightAction }: LayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-surface">
      {/* Rainbow gradient fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48"
        style={{
          background:
            'linear-gradient(180deg, rgba(249,168,212,0.35) 0%, rgba(253,186,116,0.22) 25%, rgba(253,230,138,0.18) 50%, rgba(110,231,183,0.16) 70%, transparent 100%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <svg width="36" height="36" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="39" height="39" rx="10" fill="#FFFFFF" stroke="#E6E2F0" />
            <path d="M28.5 11.5A12 12 0 1 0 28.5 28.5" stroke="#E58AA0" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M25.7 14.3A8 8 0 1 0 25.7 25.7" stroke="#E3C13F" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M22.8 17.2A4 4 0 1 0 22.8 22.8" stroke="#7DB8E0" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          <span
            style={{
              fontFamily: "'Montserrat', system-ui, sans-serif",
              fontWeight: 800,
              fontSize: '20px',
              color: '#8E4764',
              letterSpacing: '-0.5px',
            }}
          >
            Cuatri
          </span>
        </Link>

        {rightAction ?? (
          <button className="text-sm text-text-muted transition-colors hover:text-text-base">
            Salir
          </button>
        )}
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-sm text-text-muted">
        Cuatri · Planificador de cursada universitaria
      </footer>
    </div>
  );
}
