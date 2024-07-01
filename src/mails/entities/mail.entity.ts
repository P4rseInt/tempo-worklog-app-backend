import { IsString } from 'class-validator';
import { Column, Entity } from 'typeorm';

@Entity('mail')
export class Mail {
  @Column({ primary: true, generated: true })
  id: number;

  @Column()
  idIssue: number;

  @IsString()
  @Column({ length: 1000 })
  descripcion: string;

  @IsString()
  @Column({ length: 1000 })
  fechaInicio: string;

  @IsString()
  @Column({ length: 1000 })
  fechaVencimiento: string;

  @IsString()
  @Column({ length: 100 })
  porcentajeCompletado: string;

  @IsString()
  @Column({ length: 1000 })
  notas: string;
}
