import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlanDeEstudiosSchema20261008210937 implements MigrationInterface {
  name = 'CreatePlanDeEstudiosSchema20261008210937';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "carrera" (
        "id"     UUID         NOT NULL DEFAULT gen_random_uuid(),
        "nombre" VARCHAR(200) NOT NULL,
        "codigo" VARCHAR(20)  NOT NULL,
        CONSTRAINT "PK_carrera" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_carrera_nombre" UNIQUE ("nombre"),
        CONSTRAINT "UQ_carrera_codigo" UNIQUE ("codigo")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "plan_de_estudios" (
        "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "carrera_id" UUID        NOT NULL,
        "creado_en"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_plan_de_estudios" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_plan_carrera" UNIQUE ("carrera_id"),
        CONSTRAINT "FK_plan_carrera" FOREIGN KEY ("carrera_id")
          REFERENCES "carrera" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "materia" (
        "id"      UUID         NOT NULL DEFAULT gen_random_uuid(),
        "plan_id" UUID         NOT NULL,
        "nombre"  VARCHAR(200) NOT NULL,
        "anio"    SMALLINT     NOT NULL CHECK ("anio" >= 1),
        CONSTRAINT "PK_materia" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_materia_plan_nombre" UNIQUE ("plan_id", "nombre"),
        CONSTRAINT "FK_materia_plan" FOREIGN KEY ("plan_id")
          REFERENCES "plan_de_estudios" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "materia_correlativa" (
        "materia_id"     UUID NOT NULL,
        "correlativa_id" UUID NOT NULL,
        CONSTRAINT "PK_materia_correlativa" PRIMARY KEY ("materia_id", "correlativa_id"),
        CONSTRAINT "CHK_no_autocorrelativa" CHECK ("materia_id" <> "correlativa_id"),
        CONSTRAINT "FK_correlativa_materia" FOREIGN KEY ("materia_id")
          REFERENCES "materia" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_correlativa_correlativa" FOREIGN KEY ("correlativa_id")
          REFERENCES "materia" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_materia_plan_id" ON "materia" ("plan_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_mc_materia_id" ON "materia_correlativa" ("materia_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_mc_correlativa_id" ON "materia_correlativa" ("correlativa_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_mc_correlativa_id"`);
    await queryRunner.query(`DROP INDEX "IDX_mc_materia_id"`);
    await queryRunner.query(`DROP INDEX "IDX_materia_plan_id"`);
    await queryRunner.query(`DROP TABLE "materia_correlativa"`);
    await queryRunner.query(`DROP TABLE "materia"`);
    await queryRunner.query(`DROP TABLE "plan_de_estudios"`);
    await queryRunner.query(`DROP TABLE "carrera"`);
  }
}
