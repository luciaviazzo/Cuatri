import { useHealth } from '../hooks/useHealth'

export function HomePage() {
  const health = useHealth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6">
      <h1 className="text-4xl font-bold text-slate-900">Cuatri</h1>
      <p className="text-slate-600">El frontend está funcionando.</p>
      <div role="status" className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        {health.status === 'loading' && <span>Consultando backend…</span>}
        {health.status === 'ok' && (
          <span className="text-green-700">
            Backend: {health.data.status} · Base de datos: {health.data.database}
          </span>
        )}
        {health.status === 'error' && (
          <span className="text-red-700">Backend no disponible: {health.message}</span>
        )}
      </div>
    </main>
  )
}
