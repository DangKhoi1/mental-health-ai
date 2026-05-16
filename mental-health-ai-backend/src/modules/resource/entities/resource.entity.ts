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

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  resourceId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  categoryCode: string;

  @Column()
  typeCode: string;

  @Column({ type: 'varchar', nullable: true })
  contentUrl: string;

  @Column({ type: 'varchar', nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'varchar', nullable: true })
  duration: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Allcode, { nullable: true, eager: false })
  @JoinColumn({ name: 'categoryCode', referencedColumnName: 'keyMap' })
  category: Allcode;

  @ManyToOne(() => Allcode, { nullable: true, eager: false })
  @JoinColumn({ name: 'typeCode', referencedColumnName: 'keyMap' })
  resourceType: Allcode;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  createdByUser: User;
}
