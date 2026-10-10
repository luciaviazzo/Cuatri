import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CarreraEntity } from './carrera.entity.js';
import type { MateriaEntity } from './materia.entity.js';

@Entity('plan_de_estudios')
@Unique(['carrera'])
export class PlanDeEstudiosEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CarreraEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrera_id' })
  carrera: CarreraEntity;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @OneToMany('MateriaEntity', 'plan', { cascade: true })
  materias: MateriaEntity[];
}
