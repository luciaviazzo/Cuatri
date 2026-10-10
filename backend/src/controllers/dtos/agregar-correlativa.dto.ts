import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AgregarCorrelativaDto {
  @ApiProperty({ format: 'uuid', description: 'ID de la materia a agregar como correlativa' })
  @IsUUID()
  correlativaId: string;
}
