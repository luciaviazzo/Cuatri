import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarreraController } from './controllers/carrera.controller.js';
import { PlanController } from './controllers/plan.controller.js';
import { CarreraEntity } from './entities/carrera.entity.js';
import { MateriaEntity } from './entities/materia.entity.js';
import { PlanDeEstudiosEntity } from './entities/plan-de-estudios.entity.js';
import { CarreraRepository } from './repositories/carrera.repository.js';
import { PlanRepository } from './repositories/plan.repository.js';
import { CorrelativaService } from './services/correlativa.service.js';
import { PlanCargaService } from './services/plan-carga.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CarreraEntity, PlanDeEstudiosEntity, MateriaEntity]),
    MulterModule.register({ limits: { fileSize: 1_048_576 } }),
  ],
  controllers: [CarreraController, PlanController],
  providers: [PlanCargaService, CorrelativaService, CarreraRepository, PlanRepository],
})
export class PlanModule {}
