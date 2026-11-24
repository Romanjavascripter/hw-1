import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Not, Repository } from 'typeorm';
import { Avatar } from '../users/entity/avatar.entity.js';
import { S3Service } from '../../providers/s3/s3.service.js';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AvatarCleanupService {
  constructor(
    @InjectRepository(Avatar) private avatarRepo: Repository<Avatar>,
    @InjectPinoLogger(AvatarCleanupService.name)
    private readonly logger: PinoLogger,
    private s3Service: S3Service,
    private configService: ConfigService,
  ) {}

  async cleanOldAvatars() {
    const retentionDays = this.configService.get<number>(
      'AVATAR_CLEANUP_RETENTION_DAYS',
      7,
    );
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

    const BATCH_SIZE = 100;
    let deletedCount = 0;
    let failedCount = 0;

    const failedIds: string[] = [];

    this.logger.info(
      { batchSize: BATCH_SIZE },
      'Начинаю пакетную очистку аватаров',
    );

    while (true) {
      const oldAvatars = await this.avatarRepo.find({
        withDeleted: true,
        where: {
          deletedAt: LessThan(thresholdDate),
          ...(failedIds.length > 0 && { id: Not(In(failedIds)) }),
        },
        take: BATCH_SIZE,
      });
      if (oldAvatars.length === 0) {
        break;
      }
      for (const avatar of oldAvatars) {
        try {
          await this.s3Service.removeFile({ path: avatar.objectKey });
          await this.avatarRepo.delete(avatar.id);
          deletedCount++;
        } catch (error) {
          failedCount++;
          failedIds.push(avatar.id);
          this.logger.error(
            {
              avatarId: avatar.id,
              objectKey: avatar.objectKey,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            '❌ Не удалось удалить аватар из S3',
          );
        }
      }
    }
    this.logger.info({ deletedCount, failedCount }, '✅ Очистка завершена');
    return { deletedCount, failedCount };
  }
}
