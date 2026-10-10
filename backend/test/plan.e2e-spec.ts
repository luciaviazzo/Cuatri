import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

const PLAN_VALIDO = JSON.stringify({
  materias: [
    { nombre: 'Álgebra', anio: 1, correlativas: [] },
    { nombre: 'Análisis I', anio: 1, correlativas: [] },
    { nombre: 'Programación I', anio: 1, correlativas: [] },
    { nombre: 'Análisis II', anio: 2, correlativas: ['Análisis I'] },
    { nombre: 'Programación II', anio: 2, correlativas: ['Programación I'] },
    { nombre: 'Estructura de Datos', anio: 2, correlativas: ['Programación I', 'Álgebra'] },
  ],
});

const PLAN_CICLICO = JSON.stringify({
  materias: [
    { nombre: 'Materia A', anio: 1, correlativas: ['Materia B'] },
    { nombre: 'Materia B', anio: 1, correlativas: ['Materia A'] },
  ],
});

const PLAN_REDUCIDO = JSON.stringify({
  materias: [
    { nombre: 'Álgebra', anio: 1, correlativas: [] },
    { nombre: 'Física', anio: 1, correlativas: [] },
  ],
});

describe('Plan de Estudios (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication<App>;
  let carreraId: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('cuatri_test')
      .withUsername('cuatri_test')
      .withPassword('cuatri_test')
      .start();

    process.env.DB_HOST = container.getHost();
    process.env.DB_PORT = String(container.getMappedPort(5432));
    process.env.DB_USER = container.getUsername();
    process.env.DB_PASSWORD = container.getPassword();
    process.env.DB_NAME = container.getDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    const ds = app.get(DataSource);
    await ds.runMigrations();

    await ds.query(
      `INSERT INTO carrera (nombre, codigo) VALUES ('Licenciatura en Sistemas', 'LSI')`,
    );
    const rows = await ds.query(`SELECT id FROM carrera WHERE codigo = 'LSI'`);
    carreraId = (rows as { id: string }[])[0].id;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await container?.stop();
  });

  describe('US1 — Carga inicial del plan', () => {
    it('POST plan válido → 201 con 6 materias y correlativasCompletas correcto', async () => {
      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan`)
        .attach('file', Buffer.from(PLAN_VALIDO), { filename: 'plan.json', contentType: 'application/json' });

      expect(res.status).toBe(201);
      expect(res.body.materias).toHaveLength(6);

      const sinCorr = res.body.materias.filter((m: any) => m.correlativasCompletas === false);
      const conCorr = res.body.materias.filter((m: any) => m.correlativasCompletas === true);
      expect(sinCorr).toHaveLength(3);
      expect(conCorr).toHaveLength(3);
    });

    it('GET plan activo → 200', async () => {
      const res = await request(app.getHttpServer()).get(`/carreras/${carreraId}/plan`);
      expect(res.status).toBe(200);
      expect(res.body.materias).toHaveLength(6);
    });

    it('POST plan nuevo reemplaza el anterior', async () => {
      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan`)
        .attach('file', Buffer.from(PLAN_REDUCIDO), { filename: 'plan.json', contentType: 'application/json' });

      expect(res.status).toBe(201);
      expect(res.body.materias).toHaveLength(2);

      const res2 = await request(app.getHttpServer()).get(`/carreras/${carreraId}/plan`);
      expect(res2.body.materias).toHaveLength(2);
    });

    it('POST con archivo vacío → 422', async () => {
      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan`)
        .attach('file', Buffer.from('{}'), { filename: 'vacio.json', contentType: 'application/json' });
      expect(res.status).toBe(422);
    });

    it('POST sin materias → 422', async () => {
      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan`)
        .attach('file', Buffer.from(JSON.stringify({ materias: [] })), {
          filename: 'vacio.json',
          contentType: 'application/json',
        });
      expect(res.status).toBe(422);
    });

    it('POST con materia sin año → 422', async () => {
      const payload = JSON.stringify({ materias: [{ nombre: 'Física', correlativas: [] }] });
      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan`)
        .attach('file', Buffer.from(payload), { filename: 'mal.json', contentType: 'application/json' });
      expect(res.status).toBe(422);
    });

    it('POST con correlativa referencia nombre inexistente → 422', async () => {
      const payload = JSON.stringify({
        materias: [{ nombre: 'Física II', anio: 2, correlativas: ['Física I'] }],
      });
      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan`)
        .attach('file', Buffer.from(payload), { filename: 'mal.json', contentType: 'application/json' });
      expect(res.status).toBe(422);
    });

    it('POST con ciclo A→B→A → 422 con mensaje que incluye los nombres', async () => {
      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan`)
        .attach('file', Buffer.from(PLAN_CICLICO), { filename: 'ciclico.json', contentType: 'application/json' });
      expect(res.status).toBe(422);
      expect(res.body.error).toMatch(/Materia A/);
      expect(res.body.error).toMatch(/Materia B/);
    });
  });

  describe('US2 — Edición manual de correlativas', () => {
    let materiaAlgebraId: string;
    let materiaFisicaId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan`)
        .attach('file', Buffer.from(PLAN_VALIDO), { filename: 'plan.json', contentType: 'application/json' });

      const algebra = res.body.materias.find((m: any) => m.nombre === 'Álgebra');
      const analisisI = res.body.materias.find((m: any) => m.nombre === 'Análisis I');
      materiaAlgebraId = algebra.id;
      materiaFisicaId = analisisI.id;
    });

    it('POST correlativa válida → 200 + correlativasCompletas: true', async () => {
      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan/materias/${materiaAlgebraId}/correlativas`)
        .send({ correlativaId: materiaFisicaId });

      expect(res.status).toBe(201);
      expect(res.body.correlativasCompletas).toBe(true);
      expect(res.body.correlativas.some((c: any) => c.id === materiaFisicaId)).toBe(true);
    });

    it('DELETE correlativa → 200 sin la correlativa', async () => {
      const res = await request(app.getHttpServer())
        .delete(
          `/carreras/${carreraId}/plan/materias/${materiaAlgebraId}/correlativas?correlativaId=${materiaFisicaId}`,
        );

      expect(res.status).toBe(200);
      expect(res.body.correlativas.some((c: any) => c.id === materiaFisicaId)).toBe(false);
    });

    it('POST correlativa que no existe en el plan → 404', async () => {
      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan/materias/${materiaAlgebraId}/correlativas`)
        .send({ correlativaId: '00000000-0000-0000-0000-000000000000' });
      expect(res.status).toBe(404);
    });

    it('POST correlativa que crea ciclo → 422', async () => {
      const planRes = await request(app.getHttpServer()).get(`/carreras/${carreraId}/plan`);
      const analisisI = planRes.body.materias.find((m: any) => m.nombre === 'Análisis I');
      const analisisII = planRes.body.materias.find((m: any) => m.nombre === 'Análisis II');

      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan/materias/${analisisI.id}/correlativas`)
        .send({ correlativaId: analisisII.id });
      expect(res.status).toBe(422);
    });

    it('POST materia como correlativa de sí misma → 422', async () => {
      const res = await request(app.getHttpServer())
        .post(`/carreras/${carreraId}/plan/materias/${materiaAlgebraId}/correlativas`)
        .send({ correlativaId: materiaAlgebraId });
      expect(res.status).toBe(422);
    });
  });
});
