import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('Health (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication<App>;

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
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await container?.stop();
  });

  it('GET /health responde 200 con { status: "ok" }', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
