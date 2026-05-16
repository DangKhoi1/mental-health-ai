import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AssessmentTemplate } from './assessment-template.entity';
import { AssessmentAnswer } from './assessment-answer.entity';

@Entity('assessment_questions')
export class AssessmentQuestion {
  @PrimaryGeneratedColumn('uuid')
  assessmentQuestionId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int' })
  order: number;

  @ManyToOne(() => AssessmentTemplate, (template) => template.questions, {
    onDelete: 'CASCADE',
  })
  template: AssessmentTemplate;

  @OneToMany(() => AssessmentAnswer, (answer) => answer.question)
  answers: AssessmentAnswer[];

  @Column({ type: 'json', nullable: true })
  options: {
    id: string;
    optionText: string;
    score: number;
  }[];
}
