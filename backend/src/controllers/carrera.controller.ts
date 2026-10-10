import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CarreraRepository } from '../repositories/carrera.repository.js';

@ApiTags('Plan de Estudios')
@Controller('carreras')
export class CarreraController {
  constructor(private readonly carreraRepo: CarreraRepository) {}

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nombre: { type: 'string' },
          codigo: { type: 'string' },
        },
      },
    },
  })
  async listarCarreras() {
    return this.carreraRepo.findAll();
  }
}
