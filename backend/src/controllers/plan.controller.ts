import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { DomainError } from '../domain/build-plan-de-estudios.js';
import { ParseError } from '../domain/parse-plan-file.js';
import { CorrelativaService } from '../services/correlativa.service.js';
import { PlanCargaService } from '../services/plan-carga.service.js';
import { AgregarCorrelativaDto } from './dtos/agregar-correlativa.dto.js';
import { MateriaDetalleDto, PlanDeEstudiosDetalleDto } from './dtos/plan-response.dto.js';

@ApiTags('Plan de Estudios')
@Controller('carreras/:carreraId/plan')
export class PlanController {
  constructor(
    private readonly planCargaService: PlanCargaService,
    private readonly correlativaService: CorrelativaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cargar o reemplazar el plan de estudios de una carrera' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: PlanDeEstudiosDetalleDto })
  @ApiNotFoundResponse({ description: 'Carrera no encontrada' })
  @ApiUnprocessableEntityResponse({ description: 'Archivo inválido o plan rechazado' })
  async cargarPlan(
    @Param('carreraId') carreraId: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string },
  ): Promise<PlanDeEstudiosDetalleDto> {
    if (!file) {
      throw new HttpException('Se requiere un archivo.', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    try {
      return await this.planCargaService.cargarPlan(carreraId, file.buffer);
    } catch (e) {
      if (e instanceof ParseError || e instanceof DomainError) {
        throw new HttpException({ error: e.message }, HttpStatus.UNPROCESSABLE_ENTITY);
      }
      if (e instanceof NotFoundException) throw e;
      throw e;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtener el plan de estudios activo de una carrera' })
  @ApiOkResponse({ type: PlanDeEstudiosDetalleDto })
  @ApiNotFoundResponse({ description: 'Carrera sin plan activo' })
  async obtenerPlan(@Param('carreraId') carreraId: string): Promise<PlanDeEstudiosDetalleDto> {
    const plan = await this.planCargaService.getPlan(carreraId);
    if (!plan) throw new NotFoundException(`La carrera "${carreraId}" no tiene plan activo.`);
    return plan;
  }

  @Post('materias/:materiaId/correlativas')
  @ApiTags('Correlativas')
  @ApiOperation({ summary: 'Agregar una correlativa a una materia' })
  @ApiOkResponse({ type: MateriaDetalleDto })
  @ApiNotFoundResponse()
  @ApiUnprocessableEntityResponse()
  async agregarCorrelativa(
    @Param('carreraId') carreraId: string,
    @Param('materiaId') materiaId: string,
    @Body() dto: AgregarCorrelativaDto,
  ): Promise<MateriaDetalleDto> {
    try {
      return await this.correlativaService.agregarCorrelativa(
        carreraId,
        materiaId,
        dto.correlativaId,
      );
    } catch (e) {
      if (e instanceof DomainError) {
        throw new HttpException({ error: e.message }, HttpStatus.UNPROCESSABLE_ENTITY);
      }
      if (e instanceof NotFoundException) throw e;
      throw e;
    }
  }

  @Delete('materias/:materiaId/correlativas')
  @ApiTags('Correlativas')
  @ApiOperation({ summary: 'Quitar una correlativa de una materia' })
  @ApiOkResponse({ type: MateriaDetalleDto })
  @ApiNotFoundResponse()
  async quitarCorrelativa(
    @Param('carreraId') _carreraId: string,
    @Param('materiaId') materiaId: string,
    @Query('correlativaId') correlativaId: string,
  ): Promise<MateriaDetalleDto> {
    return this.correlativaService.quitarCorrelativa(materiaId, correlativaId);
  }
}
