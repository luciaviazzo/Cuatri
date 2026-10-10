import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Carrera } from '../domain/carrera.js';
import { CarreraEntity } from '../entities/carrera.entity.js';

function toCarrera(entity: CarreraEntity): Carrera {
  return { id: entity.id, nombre: entity.nombre, codigo: entity.codigo };
}

@Injectable()
export class CarreraRepository {
  constructor(
    @InjectRepository(CarreraEntity)
    private readonly repo: Repository<CarreraEntity>,
  ) {}

  async findAll(): Promise<Carrera[]> {
    const entities = await this.repo.find();
    return entities.map(toCarrera);
  }

  async findById(id: string): Promise<Carrera> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Carrera con id "${id}" no encontrada.`);
    return toCarrera(entity);
  }
}
