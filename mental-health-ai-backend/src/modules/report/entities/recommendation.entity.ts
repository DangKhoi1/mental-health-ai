import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Allcode } from '../../allcode/entities/allcode.entity';

@Entity('recommendations')
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  recommendationId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 'DAILY' })
  typeCode: string;

  @Column({ type: 'jsonb', nullable: true })
  suggestedResourceIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Allcode, { nullable: true, eager: false })
  @JoinColumn({ name: 'typeCode', referencedColumnName: 'keyMap' })
  recommendationType: Allcode;

  @ManyToOne(() => User, (user) => user.recommendations, {
    onDelete: 'CASCADE',
  })
  user: User;
}
