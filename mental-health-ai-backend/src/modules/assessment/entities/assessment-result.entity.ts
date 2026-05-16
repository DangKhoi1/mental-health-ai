import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { AssessmentSession } from './assessment-session.entity';

export enum ResultLevel {
  MINIMAL = 'MINIMAL',
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  MODERATELY_SEVERE = 'MODERATELY_SEVERE',
  SEVERE = 'SEVERE',
  LOW = 'LOW',
  HIGH = 'HIGH',
}

@Entity('assessment_results')
export class AssessmentResult {
  @PrimaryGeneratedColumn('uuid')
  assessmentResultId: string;

  @Column({ type: 'int' })
  totalScore: number;

  @Column({ type: 'enum', enum: ResultLevel })
  resultLevelCode: ResultLevel;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  completedAt: Date;
  @OneToOne(() => AssessmentSession, (session) => session.result, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  session: AssessmentSession;
}
