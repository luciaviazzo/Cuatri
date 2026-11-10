// DIAGNÓSTICO TEMPORAL (deploy en Vercel): si el arranque se cuelga, la plataforma corta la función
// a los 60 s y pierde los logs. Este temporizador convierte el cuelgue en una caída con log.
// Se importa primero en main.ts para vigilar también la carga de módulos.
// Borrar cuando el deploy funcione.

const LIMITE_MS = 25_000;

export const arranque = { etapa: 'cargando módulos' };

const temporizador = setTimeout(() => {
  console.error(
    `[boot-watchdog] el arranque no terminó en ${LIMITE_MS / 1000}s. Última etapa: "${arranque.etapa}".`,
  );
  process.exit(1);
}, LIMITE_MS);

export function arranqueTerminado(): void {
  clearTimeout(temporizador);
}
