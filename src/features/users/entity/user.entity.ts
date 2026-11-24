import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Avatar } from './avatar.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true, length: 50 })
  login: string;
  @Column({ unique: true, length: 50 })
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
