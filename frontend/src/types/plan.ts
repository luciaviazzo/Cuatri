export interface CarreraResumen {
  id: string;
  nombre: string;
  codigo: string;
}

export interface CorrelativaResumen {
  id: string;
  nombre: string;
}

export interface MateriaDetalle {
  id: string;
  nombre: string;
  anio: number;
  correlativas: CorrelativaResumen[];
  correlativasCompletas: boolean;
}

export interface PlanDeEstudiosDetalle {
  id: string;
  carreraId: string;
  creadoEn: string;
  materias: MateriaDetalle[];
}

export interface AgregarCorrelativaRequest {
  correlativaId: string;
}
