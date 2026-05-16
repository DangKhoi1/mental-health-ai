import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Journal } from './journal.entity';

@Entity('journal_images')
export class JournalImage {
  @PrimaryGeneratedColumn('uuid')
  imageId: string;

  @Column({ type: 'varchar' })
  fileName: string;

  @Column({ type: 'varchar' })
  cloudinaryUrl: string; 

  @Column({ type: 'varchar', nullable: true })
  cloudinaryPublicId: string; 

  @Column({ type: 'varchar' })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'integer', default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Journal, (journal) => journal.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'journalId' })
  journal: Journal;

  @Column({ type: 'uuid' })
  journalId: string;
}
