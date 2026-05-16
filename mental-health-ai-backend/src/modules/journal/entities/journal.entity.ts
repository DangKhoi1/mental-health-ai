import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SentimentAnalysis } from '../../ai-analysis/entities/sentiment-analysis.entity';
import { JournalImage } from './journal-image.entity';
import { InputType } from '../enums';

@Entity('journals')
export class Journal {
  @PrimaryGeneratedColumn('uuid')
  journalId: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar' })
  mood: string;

  @Column({ type: 'enum', enum: InputType, default: InputType.TEXT })
  inputType: InputType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.journals, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => JournalImage, (image) => image.journal, {
    cascade: true,
    eager: false,
  })
  images: JournalImage[];

  @OneToOne(() => SentimentAnalysis, (analysis) => analysis.journal)
  analysisResult: SentimentAnalysis;
}
