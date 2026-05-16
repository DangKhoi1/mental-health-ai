import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('allcode')
export class Allcode {
  @PrimaryGeneratedColumn('uuid')
  allCodeId: string;

  @Column()
  type: string;

  @Column({ unique: true })
  keyMap: string;

  @Column({ nullable: true })
  valueEn: string;

  @Column({ nullable: true })
  valueVi: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
