import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { Materia } from '../domain/materia.js';
import type { PlanDeEstudios } from '../domain/plan-de-estudios.js';
import { CarreraEntity } from '../entities/carrera.entity.js';
import { MateriaEntity } from '../entities/materia.entity.js';
import { PlanDeEstudiosEntity } from '../entities/plan-de-estudios.entity.js';

function toMateria(entity: MateriaEntity, planId: string): Materia {
  return {
    id: entity.id,
    planId,
    nombre: entity.nombre,
    anio: entity.anio,
    correlativaIds: (entity.correlativas ?? []).map((c) => c.id),
  };
}

function toPlanDeEstudios(entity: PlanDeEstudiosEntity): PlanDeEstudios {
  return {
    id: entity.id,
    carreraId: entity.carrera.id,
    creadoEn: entity.creadoEn,
    materias: (entity.materias ?? []).map((m) => toMateria(m, entity.id)),
  };
}

@Injectable()
export class PlanRepository {
  constructor(
    @InjectRepository(PlanDeEstudiosEntity)
    private readonly planRepo: Repository<PlanDeEstudiosEntity>,
    @InjectRepository(MateriaEntity)
    private readonly materiaRepo: Repository<MateriaEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findByCarreraId(carreraId: string): Promise<PlanDeEstudios | null> {
    const entity = await this.planRepo.findOne({
      where: { carrera: { id: carreraId } },
      relations: { carrera: true, materias: { correlativas: true } },
    });
    return entity ? toPlanDeEstudios(entity) : null;
  }

  async replaceForCarrera(
    carreraId: string,
    materias: { nombre: string; anio: number; correlativaIndices: number[] }[],
  ): Promise<PlanDeEstudios> {
    return this.dataSource.transaction(async (manager) => {
      const carrera = await manager.findOne(CarreraEntity, { where: { id: carreraId } });
      if (!carrera) throw new NotFoundException(`Carrera con id "${carreraId}" no encontrada.`);

      const existing = await manager.findOne(PlanDeEstudiosEntity, {
        where: { carrera: { id: carreraId } },
        relations: { carrera: true },
      });
      if (existing) {
        await manager.delete(MateriaEntity, { plan: { id: existing.id } });
        await manager.delete(PlanDeEstudiosEntity, { id: existing.id });
      }

      const plan = manager.create(PlanDeEstudiosEntity, { carrera });
      const savedPlan = await manager.save(PlanDeEstudiosEntity, plan);

      const savedMaterias: MateriaEntity[] = [];
      for (const m of materias) {
        const entity = manager.create(MateriaEntity, {
          plan: savedPlan,
          nombre: m.nombre,
          anio: m.anio,
          correlativas: [],
        });
        const saved = await manager.save(MateriaEntity, entity);
        savedMaterias.push(saved);
      }

      for (let i = 0; i < materias.length; i++) {
        const corrs = materias[i].correlativaIndices.map((ci) => savedMaterias[ci]);
        if (corrs.length > 0) {
          savedMaterias[i].correlativas = corrs;
          await manager.save(MateriaEntity, savedMaterias[i]);
        }
      }

      const reloaded = await manager.findOne(PlanDeEstudiosEntity, {
        where: { id: savedPlan.id },
        relations: { carrera: true, materias: { correlativas: true } },
      });
      return toPlanDeEstudios(reloaded!);
    });
  }

  async findMateriaById(id: string): Promise<Materia | null> {
    const entity = await this.materiaRepo.findOne({
      where: { id },
      relations: { plan: { carrera: true }, correlativas: true },
    });
    return entity ? toMateria(entity, entity.plan.id) : null;
  }

  async updateMateria(materiaId: string, correlativaIds: string[]): Promise<Materia> {
    return this.dataSource.transaction(async (manager) => {
      const materia = await manager.findOne(MateriaEntity, {
        where: { id: materiaId },
        relations: { plan: { carrera: true }, correlativas: true },
      });
      if (!materia) throw new NotFoundException(`Materia con id "${materiaId}" no encontrada.`);

      await manager
        .createQueryBuilder()
        .delete()
        .from('materia_correlativa')
        .where('"materia_id" = :id', { id: materiaId })
        .execute();

      if (correlativaIds.length > 0) {
        const values = correlativaIds.map((cid) => ({ materia_id: materiaId, correlativa_id: cid }));
        await manager
          .createQueryBuilder()
          .insert()
          .into('materia_correlativa')
          .values(values)
          .execute();
      }

      const reloaded = await manager.findOne(MateriaEntity, {
        where: { id: materiaId },
        relations: { plan: { carrera: true }, correlativas: true },
      });
      return toMateria(reloaded!, reloaded!.plan.id);
    });
  }
}
