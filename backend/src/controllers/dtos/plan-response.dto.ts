import { ApiProperty } from '@nestjs/swagger';

export class CorrelativaResumenDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Análisis Matemático I' })
  nombre: string;
}

export class MateriaDetalleDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Análisis Matemático II' })
  nombre: string;

  @ApiProperty({ example: 2, minimum: 1 })
  anio: number;

  @ApiProperty({ type: [CorrelativaResumenDto] })
  correlativas: CorrelativaResumenDto[];

  @ApiProperty({
    description:
      'true si la materia tiene al menos una correlativa; false si la lista está vacía (pendiente de configuración)',
  })
  correlativasCompletas: boolean;
}

export class PlanDeEstudiosDetalleDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  carreraId: string;

  @ApiProperty()
  creadoEn: Date;

  @ApiProperty({ type: [MateriaDetalleDto] })
  materias: MateriaDetalleDto[];
}
