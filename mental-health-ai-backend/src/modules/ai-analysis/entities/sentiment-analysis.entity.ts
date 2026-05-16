import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Journal } from '../../journal/entities/journal.entity';

import { SentimentResult } from '../enums/sentiment-result.enum';

@Entity('sentiment_analysis')
export class SentimentAnalysis {
  @PrimaryGeneratedColumn('uuid')
  sentimentAnalysisId: string;

  @Column({ type: 'float' })
  sentimentScore: number;

  @Column({ type: 'enum', enum: SentimentResult, nullable: true })
  detectedMood: SentimentResult;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Journal, (journal) => journal.analysisResult, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  journal: Journal;
}
