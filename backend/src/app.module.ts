import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as pg from 'pg';
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
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('DB_HOST', 'localhost');
        const port = Number(config.get('DB_PORT', 5432));
        const username = config.get<string>('DB_USER', 'cuatri');
        const password = config.get<string>('DB_PASSWORD', 'cuatri_pass');
        const database = config.get<string>('DB_NAME', 'cuatri_dev');

        // Diagnóstico de arranque: nunca imprime usuario ni contraseña, solo la forma.
        const tieneEspacios = (valor: string) => /^\s|\s$/.test(valor);
        new Logger('DatabaseConfig').log(
          `host=${host} port=${port} db=${database} ` +
            `user[definido=${config.get('DB_USER') !== undefined}, conPunto=${username.includes('.')}, ` +
            `espacios=${tieneEspacios(username)}] ` +
            `password[definida=${config.get('DB_PASSWORD') !== undefined}, espacios=${tieneEspacios(password)}]`,
        );

        return {
          type: 'postgres' as const,
          driver: pg,
          host,
          port,
          username,
          password,
          database,
          ssl: host === 'localhost' ? false : { rejectUnauthorized: false },
          synchronize: false,
          migrationsRun: true,
          // Fallar rápido: sin esto una conexión colgada deja la función sin responder hasta el timeout.
          connectTimeoutMS: 10_000,
          retryAttempts: 3,
          retryDelay: 1_000,
          entities: [CarreraEntity, PlanDeEstudiosEntity, MateriaEntity],
          migrations: [CreatePlanDeEstudiosSchema20261008210937],
        };
      },
    }),
    PlanModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
