import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Avatar } from './avatar.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index('IDX_users_login_active', {
    unique: true,
    where: '"deletedAt" IS NULL',
  })
  login: string;

  @Column()
  @Index('IDX_users_email_active', {
    unique: true,
    where: '"deletedAt" IS NULL',
  })
  email: string;

  @Column({ length: 60, select: false })
  password: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  refreshTokenHash: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  balance: string;

  @OneToMany('Avatar', 'user')
  avatars: Avatar[];
}
