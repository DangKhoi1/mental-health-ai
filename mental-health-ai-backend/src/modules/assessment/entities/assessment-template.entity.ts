import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { AssessmentQuestion } from './assessment-question.entity';
import { AssessmentSession } from './assessment-session.entity';

@Entity('assessment_templates')
export class AssessmentTemplate {
  @PrimaryGeneratedColumn('uuid')
  assessmentTemplateId: string;

  @Column()
  typeCode: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 3 })
  maxScorePerQuestion: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => AssessmentQuestion, (question) => question.template)
  questions: AssessmentQuestion[];

  @OneToMany(() => AssessmentSession, (session) => session.template)
  sessions: AssessmentSession[];

  @Column({ type: 'int', default: 0 })
  totalQuestions: number;
}
