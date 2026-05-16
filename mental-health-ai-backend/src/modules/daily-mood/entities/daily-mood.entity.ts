import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { WorkloadLevel } from '../enums';

@Entity('daily_moods')
export class DailyMood {
  @PrimaryGeneratedColumn('uuid')
  dailyMoodId: string;

  @Column({ type: 'int' })
  moodScore: number;

  @Column({ type: 'int' })
  stressLevel: number;

  @Column({ type: 'enum', enum: WorkloadLevel, nullable: true })
  workloadLevel: WorkloadLevel;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.dailyMoods, { onDelete: 'CASCADE' })
  user: User;
}
