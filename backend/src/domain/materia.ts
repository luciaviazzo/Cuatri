export interface Materia {
  id: string;
  planId: string;
  nombre: string;
  anio: number;
  correlativaIds: string[];
}

export interface ParsedMateria {
  nombre: string;
  anio: number;
  correlativasNombres: string[];
}
