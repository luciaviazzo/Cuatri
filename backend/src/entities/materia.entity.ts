import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PlanDeEstudiosEntity } from './plan-de-estudios.entity.js';

@Entity('materia')
@Unique(['plan', 'nombre'])
export class MateriaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PlanDeEstudiosEntity, (p) => p.materias, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: PlanDeEstudiosEntity;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'smallint' })
  anio: number;

  @ManyToMany(() => MateriaEntity)
  @JoinTable({
    name: 'materia_correlativa',
    joinColumn: { name: 'materia_id' },
    inverseJoinColumn: { name: 'correlativa_id' },
  })
  correlativas: MateriaEntity[];
}
