import type { Materia } from './materia.js';

export interface PlanDeEstudios {
  id: string;
  carreraId: string;
  creadoEn: Date;
  materias: Materia[];
}
