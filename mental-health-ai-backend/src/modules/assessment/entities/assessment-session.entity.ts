import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { AssessmentTemplate } from './assessment-template.entity';
import { AssessmentAnswer } from './assessment-answer.entity';
import { AssessmentResult } from './assessment-result.entity';
import { SessionStatus } from '../enums';

@Entity('assessment_sessions')
export class AssessmentSession {
  @PrimaryGeneratedColumn('uuid')
  assessmentSessionId: string;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.PENDING })
  status: SessionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @ManyToOne(() => User, (user) => user.assessmentSessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => AssessmentTemplate, (template) => template.sessions)
  template: AssessmentTemplate;

  @OneToMany(() => AssessmentAnswer, (answer) => answer.session)
  answers: AssessmentAnswer[];

  @OneToOne(() => AssessmentResult, (result) => result.session)
  result: AssessmentResult;
}
