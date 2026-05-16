import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DailyMood } from '../../daily-mood/entities/daily-mood.entity';
import { Journal } from '../../journal/entities/journal.entity';
import { SleepLog } from '../../sleep-log/entities/sleep-log.entity';
import { AssessmentSession } from '../../assessment/entities/assessment-session.entity';
import { Report } from '../../report/entities/report.entity';
import { Recommendation } from '../../report/entities/recommendation.entity';
import { ChatSession } from '../../chat/entities/chat-session.entity';
import { RiskAssessment } from '../../ai-analysis/entities/risk-assessment.entity';
import { Allcode } from '../../allcode/entities';
import { Notification } from '../../notification/entities/notification.entity';
import { Role } from '../../role/entities';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ select: false, nullable: true })
  password: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  genderCode: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  privacyPin: string | null;

  @Column({ name: 'provider', default: 'LOCAL' })
  provider: string;

  @Column({ name: 'providerId', nullable: true })
  providerId: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastReminderEmailAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  welcomeEmailSentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Allcode, { nullable: true })
  @JoinColumn({ name: 'genderCode', referencedColumnName: 'keyMap' })
  gender: Allcode;

  @OneToMany(() => DailyMood, (mood) => mood.user)
  dailyMoods: DailyMood[];

  @OneToMany(() => Journal, (journal) => journal.user)
  journals: Journal[];

  @OneToMany(() => SleepLog, (sleep) => sleep.user)
  sleepLogs: SleepLog[];

  @OneToMany(() => AssessmentSession, (session) => session.user)
  assessmentSessions: AssessmentSession[];

  @OneToMany(() => Report, (report) => report.user)
  reports: Report[];

  @OneToMany(() => Recommendation, (rec) => rec.user)
  recommendations: Recommendation[];

  @OneToMany(() => ChatSession, (chat) => chat.user)
  chatSessions: ChatSession[];

  @OneToMany(() => RiskAssessment, (risk) => risk.user)
  riskAssessments: RiskAssessment[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
