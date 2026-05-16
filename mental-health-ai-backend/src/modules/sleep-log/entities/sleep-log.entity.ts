import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SleepType } from '../enums';

@Entity('sleep_logs')
export class SleepLog {
  @PrimaryGeneratedColumn('uuid')
  sleepLogId: string;

  @Column({ type: 'timestamp' })
  bedTime: Date;

  @Column({ type: 'timestamp' })
  wakeUpTime: Date;

  @Column({ type: 'float' })
  duration: number;

  @Column({ type: 'int' })
  sleepQualityScore: number;

  @Column({ type: 'float' })
  sleepHealthScore: number;

  @Column({ type: 'text', nullable: true })
  sleepNote: string;

  @Column({ type: 'date' })
  sleepDate: Date;

  @Column({ type: 'enum', enum: SleepType, default: SleepType.NIGHT })
  sleepType: SleepType;

  @Column({ type: 'timestamp', nullable: true })
  napStartTime: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  napEndTime: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.sleepLogs, { onDelete: 'CASCADE' })
  user: User;
}
