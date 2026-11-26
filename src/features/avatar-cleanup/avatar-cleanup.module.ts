import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Avatar } from '../users/entity/avatar.entity.js';
import { S3Module } from '../../providers/s3/s3.module.js';
import { BullModule } from '@nestjs/bullmq';
import { AvatarCleanupController } from './avatar-cleanup.controller.js';
import { AvatarCleanupService } from './avatar-cleanup.service.js';
import { AvatarCleanupProcessor } from './avatar-cleanup.processor.js';
import { AvatarCleanupScheduler } from './avatar-cleanup.scheduler.js';
import { AvatarCleanupRepository } from './avatar-cleanup.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Avatar]),
    S3Module,
    BullModule.registerQueue({
      name: 'avatar-cleanup',
    }),
  ],
  controllers: [AvatarCleanupController],
  providers: [
    AvatarCleanupService,
    AvatarCleanupProcessor,
    AvatarCleanupScheduler,
    AvatarCleanupRepository,
  ],
})
export class AvatarCleanupModule {}
