import { Injectable } from '@nestjs/common';
import { buildPlanDeEstudios } from '../domain/build-plan-de-estudios.js';
import { parsePlanFile } from '../domain/parse-plan-file.js';
import { CarreraRepository } from '../repositories/carrera.repository.js';
import { PlanRepository } from '../repositories/plan.repository.js';

export interface MateriaDetalleDto {
  id: string;
  nombre: string;
  anio: number;
  correlativas: { id: string; nombre: string }[];
  correlativasCompletas: boolean;
}

export interface PlanDeEstudiosDetalleDto {
  id: string;
  carreraId: string;
  creadoEn: Date;
  materias: MateriaDetalleDto[];
}

@Injectable()
export class PlanCargaService {
  constructor(
    private readonly carreraRepo: CarreraRepository,
    private readonly planRepo: PlanRepository,
  ) {}

  async cargarPlan(carreraId: string, fileBuffer: Buffer): Promise<PlanDeEstudiosDetalleDto> {
    await this.carreraRepo.findById(carreraId);

    const raw: unknown = JSON.parse(fileBuffer.toString('utf-8'));
    const parsedMaterias = parsePlanFile(raw);
    const built = buildPlanDeEstudios(parsedMaterias, carreraId);

    const materiasInput = built.materias.map((m, _i) => ({
      nombre: m.nombre,
      anio: m.anio,
      correlativaIndices: m.correlativaIds.map((tempId) => {
        const idx = built.materias.findIndex((bm) => bm.tempId === tempId);
        return idx;
      }),
    }));

    const plan = await this.planRepo.replaceForCarrera(carreraId, materiasInput);

    const idMap = new Map<string, string>();
    plan.materias.forEach((m) => idMap.set(m.nombre, m.id));

    return {
      id: plan.id,
      carreraId: plan.carreraId,
      creadoEn: plan.creadoEn,
      materias: plan.materias.map((m) => ({
        id: m.id,
        nombre: m.nombre,
        anio: m.anio,
        correlativas: m.correlativaIds.map((cid) => {
          const corr = plan.materias.find((pm) => pm.id === cid)!;
          return { id: cid, nombre: corr.nombre };
        }),
        correlativasCompletas: m.correlativaIds.length > 0,
      })),
    };
  }

  async getPlan(carreraId: string): Promise<PlanDeEstudiosDetalleDto | null> {
    const plan = await this.planRepo.findByCarreraId(carreraId);
    if (!plan) return null;

    return {
      id: plan.id,
      carreraId: plan.carreraId,
      creadoEn: plan.creadoEn,
      materias: plan.materias.map((m) => ({
        id: m.id,
        nombre: m.nombre,
        anio: m.anio,
        correlativas: m.correlativaIds.map((cid) => {
          const corr = plan.materias.find((pm) => pm.id === cid)!;
          return { id: cid, nombre: corr?.nombre ?? '' };
        }),
        correlativasCompletas: m.correlativaIds.length > 0,
      })),
    };
  }
}
