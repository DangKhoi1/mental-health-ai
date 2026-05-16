import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { AssessmentSession } from './assessment-session.entity';
import { AssessmentQuestion } from './assessment-question.entity';

@Entity('assessment_answers')
export class AssessmentAnswer {
  @PrimaryGeneratedColumn('uuid')
  assessmentAnswerId: string;

  @Column({ type: 'int' })
  selectedScore: number;

  @ManyToOne(() => AssessmentSession, (session) => session.answers, {
    onDelete: 'CASCADE',
  })
  session: AssessmentSession;

  @ManyToOne(() => AssessmentQuestion, (question) => question.answers)
  question: AssessmentQuestion;
}
