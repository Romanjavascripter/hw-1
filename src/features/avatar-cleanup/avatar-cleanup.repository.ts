import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Not, Repository } from 'typeorm';
import { Avatar } from '../users/entity/avatar.entity.js';

@Injectable()
export class AvatarCleanupRepository {
  constructor(
    @InjectRepository(Avatar)
    private readonly repo: Repository<Avatar>,
  ) {}

  async findOldDeletedAvatars(
    thresholdDate: Date,
    limit: number,
    excludeIds: string[],
  ): Promise<Avatar[]> {
    return this.repo.find({
      withDeleted: true,
      where: {
        deletedAt: LessThan(thresholdDate),
        ...(excludeIds.length > 0 && { id: Not(In(excludeIds)) }),
      },
      take: limit,
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
