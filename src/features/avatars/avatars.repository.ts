import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Avatar } from '../users/entity/avatar.entity.js';
import { DataSource, EntityManager, Repository } from 'typeorm';

@Injectable()
export class AvatarsRepository {
  constructor(
    @InjectRepository(Avatar) private readonly repo: Repository<Avatar>,
    private readonly dataSource: DataSource,
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

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repo.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
  async createAvatarInTransaction(
    userId: string,
    avatarData: Partial<Avatar>,
    expectedCountLimit: number,
  ): Promise<Avatar | null> {
    return await this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [
        userId,
      ]);
      const activeCount = await this.countActiveAvatars(userId, manager);

      if (activeCount >= expectedCountLimit) {
        return null;
      }
      const avatar = manager.create(Avatar, avatarData);
      return manager.save(avatar);
    });
  }
}
