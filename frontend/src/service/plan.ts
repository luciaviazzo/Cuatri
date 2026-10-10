import type {
  CarreraResumen,
  MateriaDetalle,
  PlanDeEstudiosDetalle,
} from '../types/plan.js';
import { httpClient } from './httpClient.js';

export async function getCarreras(): Promise<CarreraResumen[]> {
  const res = await httpClient.get('/carreras');
  if (!res.ok) throw new Error('Error al obtener carreras');
  return res.json() as Promise<CarreraResumen[]>;
}

export async function uploadPlan(
  carreraId: string,
  file: File,
): Promise<PlanDeEstudiosDetalle> {
  const baseUrl = (import.meta.env as Record<string, string>)['VITE_API_URL'];
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${baseUrl}/carreras/${carreraId}/plan`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: 'Error desconocido' }))) as {
      error?: string;
    };
    throw new Error(body.error ?? 'Error al cargar el plan');
  }

  return res.json() as Promise<PlanDeEstudiosDetalle>;
}

export async function getPlan(carreraId: string): Promise<PlanDeEstudiosDetalle> {
  const res = await httpClient.get(`/carreras/${carreraId}/plan`);
  if (!res.ok) throw new Error('No se encontró el plan activo');
  return res.json() as Promise<PlanDeEstudiosDetalle>;
}

export async function addCorrelativa(
  carreraId: string,
  materiaId: string,
  correlativaId: string,
): Promise<MateriaDetalle> {
  const baseUrl = (import.meta.env as Record<string, string>)['VITE_API_URL'];
  const res = await fetch(
    `${baseUrl}/carreras/${carreraId}/plan/materias/${materiaId}/correlativas`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correlativaId }),
    },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: 'Error' }))) as { error?: string };
    throw new Error(body.error ?? 'Error al agregar correlativa');
  }
  return res.json() as Promise<MateriaDetalle>;
}

export async function removeCorrelativa(
  carreraId: string,
  materiaId: string,
  correlativaId: string,
): Promise<MateriaDetalle> {
  const baseUrl = (import.meta.env as Record<string, string>)['VITE_API_URL'];
  const res = await fetch(
    `${baseUrl}/carreras/${carreraId}/plan/materias/${materiaId}/correlativas?correlativaId=${correlativaId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error('Error al quitar correlativa');
  return res.json() as Promise<MateriaDetalle>;
}
