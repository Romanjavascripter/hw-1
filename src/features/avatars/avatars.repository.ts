import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Avatar } from '../users/entity/avatar.entity.js';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class AvatarsRepository {
  constructor(
    @InjectRepository(Avatar) private readonly repo: Repository<Avatar>,
  ) {}
  async countActiveAvatars(
    userId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = manager ? manager.getRepository(Avatar) : this.repo;
    return repo.count({ where: { userId } });
  }
  async findByIdAndUserId(id: string, userId: string): Promise<Avatar | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  async softDelete(id: string): Promise<void> {
    this.repo.softDelete(id);
  }
}
