import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Avatar } from '../users/entity/avatar.entity.js';
import { S3Module } from '../../providers/s3/s3.module.js';
import { AvatarsController } from './avatars.controller.js';
import { AvatarsService } from './avatars.service.js';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../../auth/auth.module.js';
import { AvatarsRepository } from './avatars.repository.js';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Avatar]),
    S3Module,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: config.getOrThrow<number>('AVATAR_MAX_BYTES'),
        },
      }),
    }),
    PassportModule,
    AuthModule,
  ],
  controllers: [AvatarsController],
  providers: [AvatarsService, AvatarsRepository],
})
export class AvatarsModule {}
