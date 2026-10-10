import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthController } from './controllers/health.controller.js';
import { CarreraEntity } from './entities/carrera.entity.js';
import { MateriaEntity } from './entities/materia.entity.js';
import { PlanDeEstudiosEntity } from './entities/plan-de-estudios.entity.js';
import { CreatePlanDeEstudiosSchema20261008210937 } from './migrations/20261008210937-CreatePlanDeEstudiosSchema.js';
import { PlanModule } from './plan.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'cuatri'),
        password: config.get('DB_PASSWORD', 'cuatri_pass'),
        database: config.get('DB_NAME', 'cuatri_dev'),
        synchronize: false,
        migrationsRun: true,
        entities: [CarreraEntity, PlanDeEstudiosEntity, MateriaEntity],
        migrations: [CreatePlanDeEstudiosSchema20261008210937],
      }),
    }),
    PlanModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
