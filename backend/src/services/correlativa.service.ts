import { Injectable, NotFoundException } from '@nestjs/common';
import { DomainError } from '../domain/build-plan-de-estudios.js';
import { detectarCiclos } from '../domain/detectar-ciclos.js';
import { PlanRepository } from '../repositories/plan.repository.js';
import type { MateriaDetalleDto } from './plan-carga.service.js';

@Injectable()
export class CorrelativaService {
  constructor(private readonly planRepo: PlanRepository) {}

  async agregarCorrelativa(
    carreraId: string,
    materiaId: string,
    correlativaId: string,
  ): Promise<MateriaDetalleDto> {
    const materia = await this.planRepo.findMateriaById(materiaId);
    if (!materia) throw new NotFoundException(`Materia con id "${materiaId}" no encontrada.`);

    const plan = await this.planRepo.findByCarreraId(carreraId);
    if (!plan) throw new NotFoundException(`La carrera "${carreraId}" no tiene plan activo.`);

    const corrMateria = plan.materias.find((m) => m.id === correlativaId);
    if (!corrMateria) {
      throw new NotFoundException(
        `La materia con id "${correlativaId}" no existe en el plan activo de la carrera.`,
      );
    }

    if (correlativaId === materiaId) {
      throw new DomainError('Una materia no puede ser correlativa de sí misma.');
    }

    const newCorrelativaIds = [...new Set([...materia.correlativaIds, correlativaId])];

    const grafo = new Map<string, string[]>();
    for (const m of plan.materias) {
      const ids = m.id === materiaId ? newCorrelativaIds : m.correlativaIds;
      grafo.set(m.id, ids);
    }

    const ciclo = detectarCiclos(grafo);
    if (ciclo.hasCycle) {
      const cicloNombres = ciclo.cycle.map((id) => {
        const m = plan.materias.find((pm) => pm.id === id);
        return m ? m.nombre : id;
      });
      throw new DomainError(
        `Agregar esta correlativa crearía un ciclo: ${cicloNombres.join(' → ')}.`,
      );
    }

    const updated = await this.planRepo.updateMateria(materiaId, newCorrelativaIds);

    const corrNombres = new Map(plan.materias.map((m) => [m.id, m.nombre]));
    return {
      id: updated.id,
      nombre: updated.nombre,
      anio: updated.anio,
      correlativas: updated.correlativaIds.map((cid) => ({
        id: cid,
        nombre: corrNombres.get(cid) ?? '',
      })),
      correlativasCompletas: updated.correlativaIds.length > 0,
    };
  }

  async quitarCorrelativa(materiaId: string, correlativaId: string): Promise<MateriaDetalleDto> {
    const materia = await this.planRepo.findMateriaById(materiaId);
    if (!materia) throw new NotFoundException(`Materia con id "${materiaId}" no encontrada.`);

    const newIds = materia.correlativaIds.filter((id) => id !== correlativaId);
    const updated = await this.planRepo.updateMateria(materiaId, newIds);

    return {
      id: updated.id,
      nombre: updated.nombre,
      anio: updated.anio,
      correlativas: updated.correlativaIds.map((cid) => ({ id: cid, nombre: '' })),
      correlativasCompletas: updated.correlativaIds.length > 0,
    };
  }
}
