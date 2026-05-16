import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { RiskLevel } from '../enums';

@Entity('risk_assessments')
export class RiskAssessment {
  @PrimaryGeneratedColumn('uuid')
  riskAssessmentId: string;

  @Column({ type: 'enum', enum: RiskLevel })
  riskLevelCode: RiskLevel;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  detectedAt: Date;

  @ManyToOne(() => User, (user) => user.riskAssessments, {
    onDelete: 'CASCADE',
  })
  user: User;
}
