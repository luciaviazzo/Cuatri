import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('carrera')
export class CarreraEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200, unique: true })
  nombre: string;

  @Column({ length: 20, unique: true })
  codigo: string;
}
