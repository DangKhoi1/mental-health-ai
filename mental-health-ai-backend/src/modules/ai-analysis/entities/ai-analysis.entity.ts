import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('ai_analysis_logs')
export class AiAnalysisEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('text')
  message: string;

  @Column('text', { nullable: true })
  response: string;

  @CreateDateColumn()
  createdAt: Date;
}
