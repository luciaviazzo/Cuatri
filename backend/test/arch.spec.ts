import { describe, it, expect } from 'vitest';
import { filesOfProject } from 'tsarch';

describe('Arquitectura — Principio I', () => {
  it('domain/ no debe importar @nestjs/*', async () => {
    const rule = filesOfProject()
      .inFolder('src/domain')
      .shouldNot()
      .dependOnFiles()
      .matchingPattern('@nestjs/');

    const violations = await rule.check();
    expect(violations).toEqual([]);
  });

  it('domain/ no debe importar typeorm', async () => {
    const rule = filesOfProject()
      .inFolder('src/domain')
      .shouldNot()
      .dependOnFiles()
      .matchingPattern('typeorm');

    const violations = await rule.check();
    expect(violations).toEqual([]);
  });

  it('controllers/ no debe importar directamente de repositories/', async () => {
    const rule = filesOfProject()
      .inFolder('src/controllers')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/repositories');

    const violations = await rule.check();
    expect(violations).toEqual([]);
  });

  it('controllers/ no debe importar directamente de adapters/', async () => {
    const rule = filesOfProject()
      .inFolder('src/controllers')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/adapters');

    const violations = await rule.check();
    expect(violations).toEqual([]);
  });
});
